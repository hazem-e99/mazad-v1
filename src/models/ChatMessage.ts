import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const chatMessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ createdAt: -1 });

export type ChatMessageDoc = InferSchemaType<typeof chatMessageSchema>;
export const ChatMessage: Model<ChatMessageDoc> =
  models.ChatMessage ?? model<ChatMessageDoc>("ChatMessage", chatMessageSchema);
