import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { BACKGROUND_TRANSITIONS, type BackgroundStatus } from "@/lib/constants";

interface Params {
  params: Promise<{ id: string }>;
}

const ACTION_BY_STATUS: Record<BackgroundStatus, string> = {
  pending: "auction.background_submitted",
  approved: "auction.background_approved",
  rejected: "auction.background_rejected",
  disabled: "auction.background_disabled",
};

/**
 * Admin decision on a plate owner's custom auction-background upload —
 * mirrors /api/listings/[id]/moderate/route.ts exactly (same schema
 * shape, same transition-table pattern, same audit-log convention). Also
 * covers "disable an already-approved background": `disabled` is just
 * another transition target, not a separate endpoint.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("listing:moderate");
    const { backgroundModerationDecisionSchema } = await getLocalizedSchemas();
    const body = backgroundModerationDecisionSchema.parse(await req.json());
    await connectDB();

    const auction = await Auction.findById(id);
    if (!auction) throw Errors.notFound("المزاد");
    if (!auction.backgroundImage) throw Errors.badRequest("لا توجد خلفية مرفوعة لهذا المزاد");

    const current = (auction.backgroundStatus ?? "pending") as BackgroundStatus;
    const allowed = BACKGROUND_TRANSITIONS[current] ?? [];
    if (!allowed.includes(body.status)) {
      throw Errors.conflict(`لا يمكن الانتقال من ${current} إلى ${body.status}`);
    }

    auction.backgroundStatus = body.status;
    auction.backgroundRejectionReason = body.status === "rejected" ? (body.rejectionReason ?? null) : null;
    await auction.save();

    await AuditLog.create({
      actor: session.sub,
      action: ACTION_BY_STATUS[body.status],
      entityType: "Auction",
      entityId: auction._id,
      metadata: body.status === "rejected" ? { rejectionReason: body.rejectionReason } : {},
    });

    return jsonOk({ success: true, backgroundStatus: auction.backgroundStatus });
  } catch (err) {
    return handleApiError(err);
  }
}
