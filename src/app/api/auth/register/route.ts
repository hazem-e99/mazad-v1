import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, setSessionCookie, effectivePermissions } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`register:${ip}`, 5, 60_000)) throw Errors.rateLimited();

    const { registerSchema } = await getLocalizedSchemas();
    const body = registerSchema.parse(await req.json());
    await connectDB();

    const existing = await User.findOne({ phone: body.phone });
    if (existing) throw Errors.conflict("رقم الجوال مستخدم بالفعل");

    const passwordHash = await hashPassword(body.password);
    const user = await User.create({
      name: body.name,
      phone: body.phone,
      passwordHash,
      role: "user",
      permissions: [],
    });

    await setSessionCookie({
      sub: String(user._id),
      role: user.role,
      permissions: effectivePermissions(user.role, []),
    });

    return jsonOk({ id: user._id, name: user.name, phone: user.phone, role: user.role }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
