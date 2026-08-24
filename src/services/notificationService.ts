import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { emitUserNotification } from "@/lib/socket";

export interface NotifyUserParams {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string;
  entityId?: string;
  link?: string;
}

/**
 * Persists one notification and pushes it over the user's realtime room.
 * Never throws into the caller's critical path — a bid/purchase/finalize
 * must commit regardless of whether the notification side-effect
 * succeeds, so every call site wraps this in try/catch anyway, but the
 * guard is duplicated here too since this is meant to be safe to call
 * fire-and-forget.
 */
export async function notifyUser(params: NotifyUserParams) {
  try {
    await connectDB();
    const doc = await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      link: params.link ?? null,
      read: false,
    });

    emitUserNotification(params.userId, {
      id: String(doc._id),
      type: doc.type,
      title: doc.title,
      body: doc.body ?? null,
      link: doc.link ?? null,
      createdAt: doc.createdAt.toISOString(),
    });

    return doc;
  } catch (err) {
    console.error("notifyUser failed:", err);
    return null;
  }
}
