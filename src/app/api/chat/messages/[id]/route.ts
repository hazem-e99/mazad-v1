import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { AuditLog } from "@/models/AuditLog";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { emitChatMessageDeleted } from "@/lib/socket";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Post-hoc removal of a message that already made it into the chat (one
 * the moderation check didn't catch, or a word not yet on the blocked
 * list) — distinct from the moderation-log flow, which stops a message
 * before it ever appears. Broadcasts the deletion over the same socket
 * connection every chat client already holds, so it disappears live for
 * everyone rather than only after their next page load.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("chat:moderate");
    await connectDB();

    const message = await ChatMessage.findById(id);
    if (!message) throw Errors.notFound("الرسالة");

    await ChatMessage.deleteOne({ _id: message._id });
    emitChatMessageDeleted(String(message._id));

    await AuditLog.create({
      actor: session.sub,
      action: "chat_message.deleted",
      entityType: "ChatMessage",
      entityId: message._id,
      metadata: { text: message.text, user: String(message.user) },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
