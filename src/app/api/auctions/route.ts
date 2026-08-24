import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission, hasPermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import type { AuctionStatus } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Auction.find(filter)
        .populate({ path: "plate", populate: { path: "logo" } })
        .populate("highestBidder", "name")
        .sort({ status: 1, endAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Auction.countDocuments(filter),
    ]);

    return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("auction:create");
    const isStaff = hasPermission(session, "auction:manage");
    const { auctionSchema } = await getLocalizedSchemas();
    const body = auctionSchema.parse(await req.json());
    await connectDB();

    const plate = await Plate.findById(body.plate);
    if (!plate) throw Errors.notFound("اللوحة");

    // The moderation gate applies to every publication path, not just the
    // marketplace feed: a user's plate that is still awaiting review (or
    // was rejected) must not reach the public site by being wrapped in an
    // auction. Approve the request first, then create the auction.
    if (plate.moderationStatus === "pending" || plate.moderationStatus === "rejected") {
      throw Errors.conflict("لا يمكن إنشاء مزاد لهذه اللوحة لأنها قيد المراجعة");
    }

    let status: AuctionStatus;
    const overrides: { category?: "regular"; backgroundStatus?: "approved" | null } = {};

    if (isStaff) {
      const now = new Date();
      status = body.startAt <= now ? "live" : "scheduled";
    } else {
      // A regular user (auction:create without auction:manage) may only
      // auction a plate they actually own, and only one active auction at
      // a time — checked here against the database, never trusted from
      // the client. The auction itself starts as "draft": unused by any
      // other creation path today, repurposed as "قيد المراجعة" (see
      // src/lib/auctionStatus.ts) until an admin approves it into
      // "scheduled"/"live" — the existing draft->scheduled/cancelled
      // transitions already implement that review workflow with no new
      // status value.
      const ownerId = String(plate.ownerUser ?? plate.createdBy ?? "");
      if (ownerId !== session.sub) throw Errors.forbidden();
      if (!plate.isVisible) throw Errors.conflict("لا يمكن إنشاء مزاد لهذه اللوحة لأنها موقوفة");

      const activeAuction = await Auction.exists({
        plate: plate._id,
        status: { $in: ["draft", "scheduled", "live"] },
      });
      if (activeAuction) throw Errors.conflict("توجد بالفعل عملية مزاد نشطة لهذه اللوحة");

      status = "draft";
      overrides.category = "regular";
      // Mirrors PATCH /api/auctions/[id]'s owner-upload rule: goes live
      // immediately, staff can still reject/disable it afterwards.
      if (body.backgroundImage) overrides.backgroundStatus = "approved";
    }

    const auction = await Auction.create({
      ...body,
      ...overrides,
      currentPrice: body.startingPrice,
      status,
      createdBy: session.sub,
    });

    await AuditLog.create({
      actor: session.sub,
      action: "auction.created",
      entityType: "Auction",
      entityId: auction._id,
      metadata: { plate: body.plate, status },
    });

    return jsonOk(auction, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
