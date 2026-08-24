import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function PATCH() {
  try {
    const session = await requireSession();
    await connectDB();
    await Notification.updateMany({ user: session.sub, read: false }, { $set: { read: true } });
    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
