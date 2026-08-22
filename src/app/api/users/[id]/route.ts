import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";

const updateUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  isActive: z.boolean().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("user:manage");
    const body = updateUserSchema.parse(await req.json());
    await connectDB();

    const user = await User.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" }).select("-passwordHash");
    if (!user) throw Errors.notFound("المستخدم");

    await AuditLog.create({
      actor: session.sub,
      action: "user.updated",
      entityType: "User",
      entityId: user._id,
      metadata: body,
    });

    return jsonOk(user);
  } catch (err) {
    return handleApiError(err);
  }
}
