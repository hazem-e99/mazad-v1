import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import "@/models/Plate";
import "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { AUCTION_TRANSITIONS, type AuctionStatus } from "@/lib/constants";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { deleteImage } from "@/lib/storage";

// These results must only ever be written by finalizeAuction(), which
// atomically computes winner/finalPrice alongside the status — never by a
// raw status write, which would leave those fields stale or empty.
const COMPUTED_RESULT_STATUSES = new Set<AuctionStatus>(["sold", "unsold"]);

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const auction = await Auction.findById(id)
      .populate({ path: "plate", populate: { path: "logo" } })
      .populate("highestBidder", "name")
      .populate("winner", "name");
    if (!auction) throw Errors.notFound("المزاد");

    const recentBids = await Bid.find({ auction: id, accepted: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name");

    return jsonOk({ auction, recentBids });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("auction:manage");
    const body = (await req.json()) as { status?: AuctionStatus; backgroundImage?: string | null };
    await connectDB();

    const auction = await Auction.findById(id);
    if (!auction) throw Errors.notFound("المزاد");

    if (body.status) {
      const allowed = AUCTION_TRANSITIONS[auction.status as AuctionStatus] ?? [];
      if (!allowed.includes(body.status)) {
        throw Errors.conflict(`لا يمكن الانتقال من ${auction.status} إلى ${body.status}`);
      }

      if (COMPUTED_RESULT_STATUSES.has(body.status)) {
        throw Errors.badRequest("لا يمكن تعيين نتيجة المزاد يدويًا — استخدم إجراء إنهاء المزاد");
      }

      auction.status = body.status;
      await auction.save();

      await AuditLog.create({
        actor: session.sub,
        action: "auction.status_changed",
        entityType: "Auction",
        entityId: auction._id,
        metadata: { status: body.status },
      });

      return jsonOk(auction);
    }

    if (body.backgroundImage !== undefined) {
      const previousImage = auction.backgroundImage;
      auction.backgroundImage = body.backgroundImage;
      await auction.save();

      if (previousImage && previousImage !== body.backgroundImage) {
        await deleteImage(previousImage);
      }

      await AuditLog.create({
        actor: session.sub,
        action: body.backgroundImage ? "auction.background_updated" : "auction.background_removed",
        entityType: "Auction",
        entityId: auction._id,
        metadata: {},
      });

      return jsonOk(auction);
    }

    return jsonOk(auction);
  } catch (err) {
    return handleApiError(err);
  }
}
