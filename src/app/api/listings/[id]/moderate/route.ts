import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { moderationDecisionSchema } from "@/lib/validation";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { MODERATION_TRANSITIONS, type ModerationStatus } from "@/lib/constants";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("listing:moderate");
    const body = moderationDecisionSchema.parse(await req.json());
    await connectDB();

    const plate = await Plate.findById(id);
    if (!plate) throw Errors.notFound("اللوحة");
    if (!plate.submissionType) throw Errors.badRequest("هذه اللوحة ليست طلب عرض قابل للمراجعة");

    const current = (plate.moderationStatus ?? "pending") as ModerationStatus;
    const allowed = MODERATION_TRANSITIONS[current] ?? [];
    if (!allowed.includes(body.status)) {
      throw Errors.conflict(`لا يمكن الانتقال من ${current} إلى ${body.status}`);
    }

    plate.moderationStatus = body.status;
    plate.rejectionReason = body.status === "rejected" ? (body.rejectionReason ?? null) : null;
    await plate.save();

    await AuditLog.create({
      actor: session.sub,
      action: body.status === "approved" ? "listing.approved" : "listing.rejected",
      entityType: "Plate",
      entityId: plate._id,
      metadata: body.status === "rejected" ? { rejectionReason: body.rejectionReason } : {},
    });

    return jsonOk({ success: true, moderationStatus: plate.moderationStatus });
  } catch (err) {
    return handleApiError(err);
  }
}
