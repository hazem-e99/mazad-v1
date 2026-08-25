import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BlockedWord } from "@/models/BlockedWord";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { normalizeToken, purgeMessagesMatchingWord } from "@/lib/chatModeration";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import { emitChatMessageDeleted } from "@/lib/socket";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("chat:moderate");
    const { blockedWordUpdateSchema } = await getLocalizedSchemas();
    const body = blockedWordUpdateSchema.parse(await req.json());
    await connectDB();

    const previous = await BlockedWord.findById(id).select("isActive normalized");
    if (!previous) throw Errors.notFound("الكلمة");
    const wasActive = previous.isActive;

    const update: Record<string, unknown> = { ...body };
    let wordTextChanged = false;
    if (body.word !== undefined) {
      const normalized = normalizeToken(body.word);
      if (!normalized) throw Errors.badRequest("الكلمة غير صالحة");

      const conflict = await BlockedWord.findOne({ normalized, _id: { $ne: id } });
      if (conflict) throw Errors.conflict("هذه الكلمة (أو ما يعادلها) موجودة بالفعل في القائمة");

      update.normalized = normalized;
      wordTextChanged = normalized !== previous.normalized;
    }

    const word = await BlockedWord.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" });
    if (!word) throw Errors.notFound("الكلمة");

    await AuditLog.create({
      actor: session.sub,
      action: "blocked_word.updated",
      entityType: "BlockedWord",
      entityId: word._id,
      metadata: body,
    });

    // Same retroactive cleanup as creating a word (see that route) —
    // triggered here by either a reactivation (false -> true) or the text
    // changing while the word stays active, since either can make it match
    // messages that were already sitting in the chat.
    const justBecameActive = word.isActive && !wasActive;
    if (word.isActive && (justBecameActive || wordTextChanged)) {
      const purged = await purgeMessagesMatchingWord(word.normalized);
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
            matchedWords: [word.normalized],
            status: "reviewed" as const,
          }))
        );
      }
    }

    return jsonOk(word);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("chat:moderate");
    await connectDB();

    const word = await BlockedWord.findById(id);
    if (!word) throw Errors.notFound("الكلمة");

    await BlockedWord.deleteOne({ _id: word._id });

    await AuditLog.create({
      actor: session.sub,
      action: "blocked_word.deleted",
      entityType: "BlockedWord",
      entityId: word._id,
      metadata: { word: word.word },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
