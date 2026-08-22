/**
 * One-time migration: converts the old hardcoded plate-logo enum
 * ("none" | "vision" | "swords_palm_black" | "swords_palm_green" |
 * "diriyah") into real PlateLogo documents, and repoints every existing
 * Plate's `logo` field from that raw string to the matching PlateLogo
 * ObjectId (or null for "none"/empty).
 *
 * Safe to re-run: it only touches Plate documents whose raw `logo` field
 * is still a string (`$type: "string"`) — once migrated to an ObjectId or
 * null, a second run finds nothing left to do. PlateLogo record creation
 * is separately idempotent via the stable `legacySlug` field (see
 * plateLogoAssets.ts), so re-running never creates duplicates even if the
 * Plate-side migration was interrupted partway through.
 *
 * Run with: npm run migrate:plate-logos
 * (equivalent to: npx tsx --env-file=.env server/migratePlateLogos.ts)
 */
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { LEGACY_LOGO_SPECS, ensureLegacyPlateLogo } from "./plateLogoAssets";

export interface PlateLogoMigrationResult {
  plateCandidates: number;
  logosCreated: number;
  platesUpdated: number;
  unrecognized: string[];
}

/** Pure migration logic — assumes the caller already connected to the database. */
export async function runPlateLogoMigration(): Promise<PlateLogoMigrationResult> {
  const legacyDocs = await Plate.collection.find({ logo: { $type: "string" } }).toArray();

  const legacyToNewId = new Map<string, mongoose.Types.ObjectId | null>();
  legacyToNewId.set("none", null);
  legacyToNewId.set("", null);

  const specBySlug = new Map(LEGACY_LOGO_SPECS.map((s) => [s.legacySlug, s]));

  let logosCreated = 0;
  let platesUpdated = 0;
  const unrecognized = new Set<string>();

  for (const doc of legacyDocs) {
    const rawValue = String(doc.logo);
    let newLogoId: mongoose.Types.ObjectId | null;

    if (legacyToNewId.has(rawValue)) {
      newLogoId = legacyToNewId.get(rawValue) ?? null;
    } else {
      const spec = specBySlug.get(rawValue);
      if (!spec) {
        // Unknown value that isn't one of the five documented legacy
        // strings — degrade to "no logo" rather than crash the migration
        // or leave the plate in a broken half-migrated state.
        unrecognized.add(rawValue);
        newLogoId = null;
        legacyToNewId.set(rawValue, null);
      } else {
        const record = await ensureLegacyPlateLogo(spec, null);
        legacyToNewId.set(rawValue, record._id);
        logosCreated += 1;
        newLogoId = record._id;
      }
    }

    await Plate.collection.updateOne({ _id: doc._id }, { $set: { logo: newLogoId } });
    platesUpdated += 1;
  }

  return {
    plateCandidates: legacyDocs.length,
    logosCreated,
    platesUpdated,
    unrecognized: Array.from(unrecognized),
  };
}

async function main() {
  await connectDB();
  console.log("Starting plate-logo migration...");

  const result = await runPlateLogoMigration();
  console.log(`Found ${result.plateCandidates} plate(s) with a legacy string logo value.`);

  if (result.plateCandidates === 0) {
    console.log("Nothing to migrate — already up to date. Done.");
    process.exit(0);
  }

  if (result.unrecognized.length > 0) {
    console.warn("WARNING: unrecognized legacy logo value(s) set to null (no logo):", result.unrecognized);
  }

  console.log(
    `Migration complete. PlateLogo records created: ${result.logosCreated}. Plate documents updated: ${result.platesUpdated}.`
  );
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Plate-logo migration failed:", err);
    process.exit(1);
  });
}
