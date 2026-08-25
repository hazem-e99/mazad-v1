import { requirePermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import "@/models/User";
import { jsonOk, handleApiError } from "@/lib/api";
import { toChatModerationLogDTOList, type LeanChatModerationLog } from "@/lib/dto";

// Never accessible without chat:moderate — a regular user (or a
// supervisor who wasn't granted it) gets the same 403 whether they hit
// this directly or the admin page tries to on their behalf.
export async function GET(req: Request) {
  try {
    await requirePermission("chat:moderate");
    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = 20;

    const [items, total] = await Promise.all([
      ChatModerationLog.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name phone")
        .lean<LeanChatModerationLog[]>(),
      ChatModerationLog.countDocuments({}),
    ]);

    return jsonOk({
      items: toChatModerationLogDTOList(items),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
