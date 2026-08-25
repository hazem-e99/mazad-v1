import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import "@/models/User";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { CHAT_MODERATION_LOG_STATUSES } from "@/lib/constants";

const updateSchema = z.object({
  status: z.enum(CHAT_MODERATION_LOG_STATUSES),
});

interface Params {
  params: Promise<{ id: string }>;
}

/** Marks one violation reviewed (or back to pending) — the message itself
 * was already permanently rejected the moment this row was written; this
 * only tracks whether a moderator has looked at it. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requirePermission("chat:moderate");
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const log = await ChatModerationLog.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" }).populate(
      "user",
      "name phone"
    );
    if (!log) throw Errors.notFound("السجل");

    return jsonOk(log);
  } catch (err) {
    return handleApiError(err);
  }
}
