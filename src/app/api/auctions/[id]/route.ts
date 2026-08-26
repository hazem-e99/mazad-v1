import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requireSession, requirePermission, hasPermission } from "@/lib/auth";
import { AUCTION_TRANSITIONS, type AuctionStatus } from "@/lib/constants";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { deleteImage } from "@/lib/storage";
import { notifyUser } from "@/services/notificationService";

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
    if (!auction || !auction.plate) throw Errors.notFound("المزاد");

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
    const body = (await req.json()) as { status?: AuctionStatus; backgroundImage?: string | null };
    await connectDB();

    // `status` changes stay staff-only; `backgroundImage` is also allowed
    // for the plate's own owner — checked below against the DB, never
    // trusted from the client. Session is required either way.
    const session = body.status ? await requirePermission("auction:manage") : await requireSession();

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

      const wasPendingReview = auction.status === "draft";
      auction.status = body.status;
      await auction.save();

      await AuditLog.create({
        actor: session.sub,
        action: "auction.status_changed",
        entityType: "Auction",
        entityId: auction._id,
        metadata: { status: body.status },
      });

      // Only a user-submitted auction's admin review (draft -> scheduled
      // = approved, draft -> cancelled = rejected) is notification-worthy
      // here — every other transition is a staff-only operational change
      // the creator doesn't need paging for.
      if (wasPendingReview && (body.status === "scheduled" || body.status === "cancelled")) {
        void notifyUser({
          userId: String(auction.createdBy),
          type: body.status === "scheduled" ? "auction.request_approved" : "auction.request_rejected",
          title: body.status === "scheduled" ? "تم اعتماد طلب المزاد" : "تم رفض طلب المزاد",
          body:
            body.status === "scheduled"
              ? "تمت الموافقة على طلب إنشاء المزاد الخاص بك"
              : "تم رفض طلب إنشاء المزاد الخاص بك",
          entityType: "Auction",
          entityId: String(auction._id),
          link: `/auctions/${auction._id}`,
        });
      }

      return jsonOk(auction);
    }

    if (body.backgroundImage !== undefined) {
      const isStaff = hasPermission(session, "auction:manage");
      if (!isStaff) {
        const plate = await Plate.findById(auction.plate).select("ownerUser createdBy");
        const ownerId = String(plate?.ownerUser ?? plate?.createdBy ?? "");
        if (ownerId !== session.sub) throw Errors.forbidden();
      }

      const previousImage = auction.backgroundImage;
      auction.backgroundImage = body.backgroundImage;
      // Goes live immediately for staff and owner alike — no pre-approval
      // queue to sit in. Staff keep the moderate endpoint to reject/disable
      // an image after the fact (BACKGROUND_TRANSITIONS still allows
      // approved -> rejected/disabled), so this is post-moderation, not no
      // moderation.
      auction.backgroundStatus = body.backgroundImage ? "approved" : null;
      auction.backgroundRejectionReason = null;
      await auction.save();

      if (previousImage && previousImage !== body.backgroundImage) {
        await deleteImage(previousImage);
      }

      await AuditLog.create({
        actor: session.sub,
        action: body.backgroundImage ? "auction.background_approved" : "auction.background_removed",
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
