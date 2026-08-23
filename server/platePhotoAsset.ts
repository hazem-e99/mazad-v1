import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageExists, saveImageAt } from "@/lib/storage";

/**
 * The placeholder photo seeded listings point at.
 *
 * Deliberately a *stable* key, not a UUID: the seed has always written
 * this exact string onto its listings, so materializing the asset here
 * repairs every existing row without touching the database.
 */
export const SEED_PLATE_PHOTO = "/api/site-assets/seed-sample-plate.webp";

const SEED_PLATE_PHOTO_SUBDIR = "seed";
const SEED_PLATE_PHOTO_FILENAME = "seed-sample-plate.webp";

/** A real plate photograph that *is* committed to the repo. */
const SOURCE_ASSET = path.join(process.cwd(), "public", "images", "License1.png");

/**
 * Idempotently guarantees the seed placeholder photo exists in the
 * database, and returns its public path.
 *
 * This closes the same gap `ensureLegacyPlateLogo` closes for logos: since
 * both the Plate row and its artwork live in the same shared database now,
 * this only needs to run once ever — every clone pointed at that database
 * already has the asset.
 *
 * Safe to call repeatedly: an existing asset is left alone.
 */
export async function ensureSeedPlatePhoto(): Promise<string> {
  if (await imageExists(SEED_PLATE_PHOTO)) return SEED_PLATE_PHOTO;

  const source = await readFile(SOURCE_ASSET);
  return saveImageAt(source, SEED_PLATE_PHOTO_SUBDIR, SEED_PLATE_PHOTO_FILENAME);
}
