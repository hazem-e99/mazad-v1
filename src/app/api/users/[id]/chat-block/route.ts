import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

const schema = z.object({ chatBlocked: z.boolean() });

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Deliberately its own route rather than a field on the general
 * PATCH /api/users/[id] (which requires `user:manage`): a moderator
 * granted only `chat:moderate` — the whole point of that permission
 * existing separately — must be able to block someone from chat without
 * also being handed full user management (role/permissions/account
 * status). Never touches `status`/`isActive`, so bidding/purchase
 * eligibility is unaffected either way (§ chat moderation scope).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("chat:moderate");
    const body = schema.parse(await req.json());
    await connectDB();

    const user = await User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { chatBlocked: body.chatBlocked } },
      { returnDocument: "after" }
    ).select("-passwordHash");
    if (!user) throw Errors.notFound("المستخدم");

    await AuditLog.create({
      actor: session.sub,
      action: body.chatBlocked ? "user.chat_blocked" : "user.chat_unblocked",
      entityType: "User",
      entityId: user._id,
      metadata: {},
    });

    return jsonOk(user);
  } catch (err) {
    return handleApiError(err);
  }
}
