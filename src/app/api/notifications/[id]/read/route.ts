import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Ownership is enforced by the query filter itself (`user: session.sub`)
 * rather than a separate 403 branch — a foreign id simply matches zero
 * documents, so a user can never mark, or even detect, another user's
 * notification by guessing/tampering with the id in the URL.
 */
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await connectDB();

    await Notification.updateOne({ _id: id, user: session.sub }, { $set: { read: true } });
    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
