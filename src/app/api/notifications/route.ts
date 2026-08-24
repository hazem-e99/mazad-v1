import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

/** Always scoped to the caller's own session id — never a client-supplied
 * user id — so one user can never list another's notifications. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);

    const filter = { user: session.sub };
    const [items, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return jsonOk({ items, total, unread, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}
