import { connectDB } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";
import { emitChatCleared } from "@/lib/socket";

export async function GET() {
  try {
    await connectDB();
    const messages = await ChatMessage.find({}).sort({ createdAt: -1 }).limit(50).populate("user", "name");
    return jsonOk(messages.reverse());
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Wipes the entire (single, global — see ChatMessage's own docstring)
 * chat room in one action. Distinct from deleting one message
 * (DELETE /api/chat/messages/[id]): this is a bulk moderation tool, not
 * tied to any specific violation, so it isn't recorded in
 * ChatModerationLog (that collection is specifically "messages a rule
 * caught") — the single AuditLog entry is the record of who cleared it
 * and when.
 */
export async function DELETE() {
  try {
    const session = await requirePermission("chat:moderate");
    await connectDB();

    const { deletedCount } = await ChatMessage.deleteMany({});
    emitChatCleared();

    await AuditLog.create({
      actor: session.sub,
      action: "chat.cleared",
      entityType: "ChatMessage",
      entityId: session.sub,
      metadata: { deletedCount },
    });

    return jsonOk({ success: true, deletedCount });
  } catch (err) {
    return handleApiError(err);
  }
}
