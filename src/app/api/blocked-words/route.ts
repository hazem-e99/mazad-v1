import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BlockedWord } from "@/models/BlockedWord";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { toBlockedWordDTOList, type LeanBlockedWord } from "@/lib/dto";
import { normalizeToken, purgeMessagesMatchingWord } from "@/lib/chatModeration";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import { emitChatMessageDeleted } from "@/lib/socket";

// Never exposed to regular users — the whole point of the list is that a
// message sender must not learn what it's being checked against, so
// reading it requires the same permission managing it does.
export async function GET() {
  try {
    await requirePermission("chat:moderate");
    await connectDB();
    const words = await BlockedWord.find({}).sort({ createdAt: -1 }).lean<LeanBlockedWord[]>();
    return jsonOk({ items: toBlockedWordDTOList(words) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("chat:moderate");
    const { blockedWordCreateSchema } = await getLocalizedSchemas();
    const body = blockedWordCreateSchema.parse(await req.json());
    await connectDB();

    const normalized = normalizeToken(body.word);
    if (!normalized) throw Errors.badRequest("الكلمة غير صالحة");

    const existing = await BlockedWord.findOne({ normalized });
    if (existing) throw Errors.conflict("هذه الكلمة (أو ما يعادلها) موجودة بالفعل في القائمة");

    const word = await BlockedWord.create({ ...body, normalized, createdBy: session.sub });

    await AuditLog.create({
      actor: session.sub,
      action: "blocked_word.created",
      entityType: "BlockedWord",
      entityId: word._id,
      metadata: { word: word.word },
    });

    // A newly-blocked word applies retroactively: anything already sitting
    // in the chat that matches it is removed and broadcast live, not left
    // to be found manually — see purgeMessagesMatchingWord's docstring.
    if (word.isActive) {
      const purged = await purgeMessagesMatchingWord(normalized);
      for (const message of purged) {
        emitChatMessageDeleted(message.id);
      }
      if (purged.length > 0) {
        await ChatModerationLog.insertMany(
          purged.map((message) => ({
            user: message.userId,
            messageText: message.text,
            reason: "تمت إضافة الكلمة إلى قائمة الحظر بعد إرسال هذه الرسالة",
            violationType: "blocked_word" as const,
            matchedWords: [normalized],
            status: "reviewed" as const,
          }))
        );
      }
    }

    return jsonOk(word, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
