import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();
    const count = await Notification.countDocuments({ user: session.sub, read: false });
    return jsonOk({ count });
  } catch (err) {
    return handleApiError(err);
  }
}
