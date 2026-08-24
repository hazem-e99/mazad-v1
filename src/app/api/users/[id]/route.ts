import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { USER_ROLES, PERMISSIONS, USER_STATUSES } from "@/lib/constants";

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  role: z.enum(USER_ROLES).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  status: z.enum(USER_STATUSES).optional(),
  // Legacy field — still accepted so nothing calling the old shape breaks,
  // but `status` (when present) is the one that decides the account state.
  isActive: z.boolean().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requirePermission("user:manage");
    await connectDB();

    const user = await User.findOne({ _id: id, deletedAt: null }).select("-passwordHash");
    if (!user) throw Errors.notFound("المستخدم");

    return jsonOk(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("user:manage");
    const body = updateUserSchema.parse(await req.json());
    await connectDB();

    const existing = await User.findOne({ _id: id, deletedAt: null });
    if (!existing) throw Errors.notFound("المستخدم");

    const update: Record<string, unknown> = { ...body };
    if (body.email === "") update.email = null;

    // `status` is the authority; keep the legacy `isActive` boolean in sync
    // with it so nothing still reading that field regresses.
    if (body.status) update.isActive = body.status === "active";
    else if (body.isActive != null) update.status = body.isActive ? "active" : "suspended";

    const previousStatus = existing.status ?? (existing.isActive ? "active" : "suspended");
    const nextStatus = (update.status as string | undefined) ?? previousStatus;

    const user = await User.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" }).select("-passwordHash");
    if (!user) throw Errors.notFound("المستخدم");

    const action =
      nextStatus !== previousStatus
        ? nextStatus === "active"
          ? "user.reactivated"
          : "user.suspended"
        : "user.updated";

    await AuditLog.create({
      actor: session.sub,
      action,
      entityType: "User",
      entityId: user._id,
      metadata: body,
    });

    return jsonOk(user);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Soft delete only — never removes the document. Historical bids, auctions
 * and purchases reference this user's _id and must keep resolving (see
 * toUserRefDTO/toBidDTO, which already degrade gracefully for a user that
 * no longer resolves as "active"). The partial unique index on
 * phone/email (see src/models/User.ts) lets the same phone/email be reused
 * by a new account after this.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("user:manage");
    await connectDB();

    const existing = await User.findOne({ _id: id, deletedAt: null });
    if (!existing) throw Errors.notFound("المستخدم");

    existing.deletedAt = new Date();
    existing.status = "disabled";
    existing.isActive = false;
    await existing.save();

    await AuditLog.create({
      actor: session.sub,
      action: "user.deleted",
      entityType: "User",
      entityId: existing._id,
      metadata: {},
    });

    return jsonOk({ _id: String(existing._id) });
  } catch (err) {
    return handleApiError(err);
  }
}
