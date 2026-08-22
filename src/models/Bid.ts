import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

// Bids are append-only: never updated or deleted, forming the immutable
// audit trail for an auction's price history.
const bidSchema = new Schema(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    accepted: { type: Boolean, default: true },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

bidSchema.index({ auction: 1, createdAt: -1 });
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ user: 1, createdAt: -1 });

export type BidDoc = InferSchemaType<typeof bidSchema>;
export const Bid: Model<BidDoc> = registerModel<BidDoc>("Bid", bidSchema);
