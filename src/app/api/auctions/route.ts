import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { auctionSchema } from "@/lib/validation";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

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
    const body = auctionSchema.parse(await req.json());
    await connectDB();

    const plate = await Plate.findById(body.plate);
    if (!plate) throw Errors.notFound("اللوحة");

    // The moderation gate applies to every publication path, not just the
    // marketplace feed: a user's plate that is still awaiting review (or
    // was rejected) must not reach the public site by being wrapped in an
    // auction. Approve the request first, then create the auction.
    if (plate.moderationStatus === "pending" || plate.moderationStatus === "rejected") {
      throw Errors.conflict("لا يمكن إنشاء مزاد للوحة لم تتم الموافقة عليها بعد");
    }

    const now = new Date();
    const status = body.startAt <= now ? "live" : "scheduled";

    const auction = await Auction.create({
      ...body,
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
