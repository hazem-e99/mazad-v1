/**
 * One-time migration for the marketplace/auction-request feature set:
 *
 * 1. Splits the legacy `Plate.type` enum (which conflated classification,
 *    usage, and shape into one value) into three independent fields:
 *      individual -> classification: single
 *      transfer   -> usageType: transport
 *      private    -> usageType: private
 *      sport      -> usageType: sport
 *      wide, small_square, small_sport -> shape: <same value>
 *    `type` itself is left untouched — every existing call site that reads
 *    it keeps working unchanged; these are purely additive new fields.
 *
 * 2. Backfills `moderationStatus: "approved"` on every existing plate that
 *    doesn't have one yet, so already-visible plates/auctions/VIP listings
 *    are never hidden by the new moderation gate. `submissionType` is left
 *    `null` for these (they were never submitted through the new listing
 *    flow — that distinction must stay real, never guessed).
 *
 * Safe to re-run: every write is a targeted $set scoped to a query that
 * excludes documents already carrying the target field, so a second run
 * finds nothing left to do.
 *
 * Run with: npm run migrate:plate-listing-fields
 */
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import type { PlateType, PlateClassification, UsageType, PlateShape } from "@/lib/constants";

const CLASSIFICATION_BY_TYPE: Partial<Record<PlateType, PlateClassification>> = {
  individual: "single",
};
const USAGE_TYPE_BY_TYPE: Partial<Record<PlateType, UsageType>> = {
  transfer: "transport",
  private: "private",
  sport: "sport",
};
const SHAPE_BY_TYPE: Partial<Record<PlateType, PlateShape>> = {
  wide: "wide",
  small_square: "small_square",
  small_sport: "small_sport",
};

export interface PlateListingFieldsMigrationResult {
  classificationBackfilled: number;
  usageTypeBackfilled: number;
  shapeBackfilled: number;
  moderationStatusBackfilled: number;
}

export async function runPlateListingFieldsMigration(): Promise<PlateListingFieldsMigrationResult> {
  const result: PlateListingFieldsMigrationResult = {
    classificationBackfilled: 0,
    usageTypeBackfilled: 0,
    shapeBackfilled: 0,
    moderationStatusBackfilled: 0,
  };

  for (const [type, classification] of Object.entries(CLASSIFICATION_BY_TYPE) as [PlateType, PlateClassification][]) {
    const res = await Plate.updateMany({ type, classification: null }, { $set: { classification } });
    result.classificationBackfilled += res.modifiedCount;
  }

  for (const [type, usageType] of Object.entries(USAGE_TYPE_BY_TYPE) as [PlateType, UsageType][]) {
    const res = await Plate.updateMany({ type, usageType: null }, { $set: { usageType } });
    result.usageTypeBackfilled += res.modifiedCount;
  }

  for (const [type, shape] of Object.entries(SHAPE_BY_TYPE) as [PlateType, PlateShape][]) {
    const res = await Plate.updateMany({ type, shape: null }, { $set: { shape } });
    result.shapeBackfilled += res.modifiedCount;
  }

  const moderationRes = await Plate.updateMany({ moderationStatus: null }, { $set: { moderationStatus: "approved" } });
  result.moderationStatusBackfilled = moderationRes.modifiedCount;

  return result;
}

async function main() {
  await connectDB();
  console.log("Starting plate listing-fields migration...");
  const result = await runPlateListingFieldsMigration();
  console.log("Migration complete:", result);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Plate listing-fields migration failed:", err);
    process.exit(1);
  });
}
