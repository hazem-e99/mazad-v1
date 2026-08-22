import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw Errors.unauthorized();

    await connectDB();
    const user = await User.findById(session.sub);
    if (!user) throw Errors.unauthorized();

    return jsonOk({
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      permissions: session.permissions,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
