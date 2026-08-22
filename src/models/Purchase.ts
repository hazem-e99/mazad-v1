import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const purchaseSchema = new Schema(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true, unique: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

purchaseSchema.index({ buyer: 1, createdAt: -1 });

export type PurchaseDoc = InferSchemaType<typeof purchaseSchema>;
export const Purchase: Model<PurchaseDoc> = registerModel<PurchaseDoc>("Purchase", purchaseSchema);
