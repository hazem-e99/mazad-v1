import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const pageVisitSchema = new Schema(
  {
    visitorId: { type: String, required: true },
    // Local calendar day ("YYYY-MM-DD", Asia/Riyadh — same STATS_TIMEZONE
    // convention as adminQueries.ts), not a UTC timestamp bucket.
    date: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// The actual spam guard: one row per visitor per day, enforced at the
// database layer rather than trusted from the client.
pageVisitSchema.index({ visitorId: 1, date: 1 }, { unique: true });
pageVisitSchema.index({ date: 1 });

export type PageVisitDoc = InferSchemaType<typeof pageVisitSchema>;
export const PageVisit: Model<PageVisitDoc> = registerModel<PageVisitDoc>("PageVisit", pageVisitSchema);
