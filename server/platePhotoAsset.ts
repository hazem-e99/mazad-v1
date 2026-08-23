import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageExists, saveImageAt } from "@/lib/storage";

/**
 * The placeholder photo seeded listings point at.
 *
 * Deliberately a *stable* path, not a UUID: the seed has always written
 * this exact string onto its listings, so materializing the file here
 * repairs every existing row without touching the database.
 */
export const SEED_PLATE_PHOTO = "/uploads/seed/sample-plate.webp";

const SEED_PLATE_PHOTO_SUBDIR = "seed";
const SEED_PLATE_PHOTO_FILENAME = "sample-plate.webp";

/** A real plate photograph that *is* committed to the repo — unlike
 * anything under public/uploads, which is gitignored local storage. */
const SOURCE_ASSET = path.join(process.cwd(), "public", "images", "License1.png");

/**
 * Idempotently guarantees the seed placeholder photo exists on disk, and
 * returns its public path.
 *
 * This closes the same gap `ensureLegacyPlateLogo` closes for logos: the
 * Plate row lives in the shared database while its artwork lives in
 * gitignored local storage, so a clone that never generated the file
 * inherits rows pointing at nothing and renders a broken <img>. Earlier
 * revisions of the seed asserted this path was "a real static asset
 * already shipped with the app" — it never was, and nothing created it.
 *
 * Safe to call repeatedly: an existing file is left alone.
 */
export async function ensureSeedPlatePhoto(): Promise<string> {
  if (await imageExists(SEED_PLATE_PHOTO)) return SEED_PLATE_PHOTO;

  const source = await readFile(SOURCE_ASSET);
  return saveImageAt(source, SEED_PLATE_PHOTO_SUBDIR, SEED_PLATE_PHOTO_FILENAME);
}
