import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requireSession, verifyPassword, hashPassword, setSessionCookie } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    if (!rateLimit(`change-pw:${session.sub}`, 5, 15 * 60_000)) {
      throw Errors.rateLimited();
    }

    const { changePasswordSchema } = await getLocalizedSchemas();
    const body = changePasswordSchema.parse(await req.json());
    await connectDB();

    const user = await User.findById(session.sub).select("+passwordHash");
    if (!user || user.deletedAt || (user.status && user.status !== "active")) {
      throw Errors.unauthorized();
    }

    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) {
      throw Errors.badRequest("كلمة المرور الحالية غير صحيحة");
    }

    const newHash = await hashPassword(body.newPassword);
    await User.updateOne({ _id: user._id }, { $set: { passwordHash: newHash } });

    await setSessionCookie(session);

    await AuditLog.create({
      actor: user._id,
      action: "account.password_changed",
      entityType: "User",
      entityId: user._id,
      metadata: {},
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
