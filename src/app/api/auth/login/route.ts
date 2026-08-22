import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, setSessionCookie, effectivePermissions } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import type { Permission, UserRole } from "@/lib/constants";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`login:${ip}`, 10, 60_000)) throw Errors.rateLimited();

    const body = loginSchema.parse(await req.json());
    await connectDB();

    const user = await User.findOne({ phone: body.phone }).select("+passwordHash");
    if (!user) throw Errors.badRequest("رقم الجوال أو كلمة المرور غير صحيحة");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw Errors.conflict("الحساب مقفل مؤقتًا بسبب محاولات دخول فاشلة متكررة");
    }

    if (!user.isActive) throw Errors.forbidden();

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            failedLoginAttempts: shouldLock ? 0 : attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
          },
        }
      );
      throw Errors.badRequest("رقم الجوال أو كلمة المرور غير صحيحة");
    }

    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });

    const permissions = effectivePermissions(user.role as UserRole, user.permissions as Permission[]);
    await setSessionCookie({ sub: String(user._id), role: user.role as UserRole, permissions });

    return jsonOk({ id: user._id, name: user.name, phone: user.phone, role: user.role });
  } catch (err) {
    return handleApiError(err);
  }
}
