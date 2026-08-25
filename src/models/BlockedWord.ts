import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

/**
 * One entry in the chat's blocked-word list. `word` is exactly what the
 * admin typed — shown back to them in the management UI. `normalized` is
 * the same word run through the moderation normalizer (see
 * src/lib/chatModeration.ts) and is what every incoming chat message is
 * actually compared against, so a word survives casing, Arabic diacritics,
 * letter-variant and simple obfuscation differences the same way on both
 * sides of the comparison.
 */
const blockedWordSchema = new Schema(
  {
    word: { type: String, required: true, trim: true, maxlength: 100 },
    normalized: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// The moderation check loads every active word on a cache miss (see
// getActiveBlockedWords) — this index makes that a covered scan.
blockedWordSchema.index({ isActive: 1 });
// Case/diacritic-insensitive de-dup at the data layer: two admins adding
// what normalizes to the same word shouldn't silently create two rows that
// then both need editing/deleting to fully unblock (or reblock) it.
blockedWordSchema.index({ normalized: 1 }, { unique: true });

export type BlockedWordDoc = InferSchemaType<typeof blockedWordSchema>;
export const BlockedWord: Model<BlockedWordDoc> = registerModel<BlockedWordDoc>("BlockedWord", blockedWordSchema);
