import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // "bid.outbid" | "auction.won" | "auction.sold" | "auction.unsold" |
    // "auction.direct_purchase_buyer" | "auction.direct_purchase_seller" |
    // "listing.approved" | "listing.rejected" |
    // "auction.request_approved" | "auction.request_rejected"
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 500, default: null },
    entityType: { type: String, default: null },
    entityId: { type: Schema.Types.ObjectId, default: null },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification: Model<NotificationDoc> = registerModel<NotificationDoc>("Notification", notificationSchema);
