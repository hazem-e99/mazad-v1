import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";
import { CHAT_VIOLATION_TYPES, CHAT_MODERATION_LOG_STATUSES } from "@/lib/constants";

/**
 * A record of one *rejected* chat message — the message never reached
 * ChatMessage/the realtime broadcast, so this is the only place its text
 * survives. Kept as its own collection rather than folded into AuditLog:
 * an audit entry records an admin action on an entity that exists, while
 * this records the opposite — something a regular user tried that was
 * refused before it became anything.
 *
 * `user` is a ref (not a denormalized name snapshot), same as AuditLog's
 * `actor` — populated at query time so a later name change is reflected
 * automatically instead of the log carrying a stale copy.
 *
 * `auctionId` is nullable: the site's chat (see src/app/(public)/chat) is
 * one global room, not per-auction, so today every row has this null.
 * The field exists so a future per-auction chat doesn't need a schema
 * change, only for that code path to start populating it.
 */
const chatModerationLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction", default: null },
    messageText: { type: String, required: true, maxlength: 500 },
    reason: { type: String, required: true },
    violationType: { type: String, enum: CHAT_VIOLATION_TYPES, required: true },
    matchedWords: { type: [String], default: [] },
    status: { type: String, enum: CHAT_MODERATION_LOG_STATUSES, default: "pending" },
  },
  { timestamps: true }
);

chatModerationLogSchema.index({ createdAt: -1 });
chatModerationLogSchema.index({ user: 1, createdAt: -1 });
chatModerationLogSchema.index({ status: 1 });

export type ChatModerationLogDoc = InferSchemaType<typeof chatModerationLogSchema>;
export const ChatModerationLog: Model<ChatModerationLogDoc> = registerModel<ChatModerationLogDoc>(
  "ChatModerationLog",
  chatModerationLogSchema
);
