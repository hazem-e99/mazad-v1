import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";
import { AUCTION_CATEGORIES, AUCTION_STATUSES, BACKGROUND_STATUSES } from "@/lib/constants";

const auctionSchema = new Schema(
  {
    plate: { type: Schema.Types.ObjectId, ref: "Plate", required: true },
    category: { type: String, enum: AUCTION_CATEGORIES, default: "regular" },
    status: { type: String, enum: AUCTION_STATUSES, default: "draft", required: true },

    startingPrice: { type: Number, required: true, min: 0 },
    minIncrement: { type: Number, required: true, min: 1 },
    currentPrice: { type: Number, required: true, min: 0 },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    directPurchaseEnabled: { type: Boolean, default: false },
    directPurchasePrice: { type: Number, default: null, min: 0 },

    backgroundImage: { type: String, default: null },
    // null = no background uploaded yet, OR a legacy admin-set background
    // that predates this field (still rendered publicly for backward
    // compatibility — see the public auction page's render gate). A real
    // owner submission always starts at "pending"; staff uploads (already
    // the approving authority elsewhere in this codebase) go straight to
    // "approved".
    backgroundStatus: { type: String, enum: BACKGROUND_STATUSES, default: null },
    backgroundRejectionReason: { type: String, trim: true, maxlength: 500, default: null },

    highestBid: { type: Schema.Types.ObjectId, ref: "Bid", default: null },
    highestBidder: { type: Schema.Types.ObjectId, ref: "User", default: null },
    bidCount: { type: Number, default: 0 },

    winner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    finalPrice: { type: Number, default: null },
    finalizedAt: { type: Date, default: null },

    purchasedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    purchasedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Optimistic concurrency token — every bid/purchase/status mutation
    // increments this; conditional writes use it to reject stale racers.
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ plate: 1 });

// Compound indexes matching the scheduler's exact query shapes
// (server/index.ts tick -> auctionService.activateScheduledAuctions /
// finalizeExpiredAuctions) so those scans use an index instead of falling
// back to a single-field index plus in-memory filtering.
auctionSchema.index({ status: 1, startAt: 1 });
auctionSchema.index({ status: 1, endAt: 1 });

export type AuctionDoc = InferSchemaType<typeof auctionSchema>;
export const Auction: Model<AuctionDoc> = registerModel<AuctionDoc>("Auction", auctionSchema);
