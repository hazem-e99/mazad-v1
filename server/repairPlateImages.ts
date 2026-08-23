/**
 * Repairs plates whose stored photo asset is missing from the database —
 * the rows render as a broken <img> on the home page, the marketplace grid
 * and the listing detail page even though the rest of the API and database
 * are perfectly healthy. Image bytes now live in MongoDB alongside the
 * Plate documents (see src/lib/storage.ts), so this class of drift should
 * be rare — mainly useful for recovering from a row that references an
 * asset deleted out from under it.
 *
 * The plate-photo twin of repairPlateLogoImages.ts.
 *
 * Two populations, two treatments:
 *
 *   - Seeded listings all point at one stable placeholder key, whose
 *     artwork is generated from a committed asset — those are simply
 *     materialized (see server/platePhotoAsset.ts), no row is touched.
 *   - A real upload has no code-side source to regenerate from. Rather
 *     than leave a permanently broken <img>, `image` is cleared so the UI
 *     falls back to the generated SaudiPlate rendering, and the row is
 *     reported so the photo can be re-uploaded.
 *
 * Pass --dry-run to report without writing anything.
 *
 * Safe to re-run: plates whose asset is present are left untouched.
 *
 * Run with: npm run repair:plate-images
 * (equivalent to: npx tsx --env-file=.env server/repairPlateImages.ts)
 */
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { imageExists } from "@/lib/storage";
import { SEED_PLATE_PHOTO, ensureSeedPlatePhoto } from "./platePhotoAsset";

export interface ClearedPlateImage {
  id: string;
  title: string;
  image: string;
}

export interface PlateImageRepairResult {
  checked: number;
  /** True when the shared seed placeholder had to be written to disk. */
  placeholderRestored: boolean;
  /** Rows healed purely by restoring the placeholder — never rewritten. */
  healedByPlaceholder: number;
  /** Orphaned uploads whose `image` was cleared (or would be, on a dry run). */
  cleared: ClearedPlateImage[];
}

/** Pure repair logic — assumes the caller already connected to the database. */
export async function runPlateImageRepair({ dryRun = false } = {}): Promise<PlateImageRepairResult> {
  const placeholderWasMissing = !(await imageExists(SEED_PLATE_PHOTO));
  if (placeholderWasMissing && !dryRun) await ensureSeedPlatePhoto();

  // Only rows that claim to have a photo are of interest; a null `image`
  // already renders the generated plate and is not a defect.
  const plates = await Plate.find({ image: { $nin: [null, ""] } })
    .select("title image")
    .lean<{ _id: unknown; title: string | null; image: string }[]>();

  let healedByPlaceholder = 0;
  const cleared: ClearedPlateImage[] = [];

  for (const plate of plates) {
    if (plate.image === SEED_PLATE_PHOTO) {
      // Restoring the file above fixed every one of these at once.
      if (placeholderWasMissing) healedByPlaceholder += 1;
      continue;
    }

    if (await imageExists(plate.image)) continue;

    cleared.push({ id: String(plate._id), title: plate.title ?? "(بدون عنوان)", image: plate.image });
    if (!dryRun) await Plate.updateOne({ _id: plate._id }, { $set: { image: null } });
  }

  return {
    checked: plates.length,
    placeholderRestored: placeholderWasMissing,
    healedByPlaceholder,
    cleared,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await connectDB();
  console.log(`Checking plate photo files${dryRun ? " (dry run — nothing will be written)" : ""}...`);

  const result = await runPlateImageRepair({ dryRun });
  console.log(`Checked ${result.checked} plate(s) carrying a photo path.`);

  if (result.placeholderRestored) {
    console.log(
      `${dryRun ? "WOULD RESTORE" : "Restored"} the seed placeholder at ${SEED_PLATE_PHOTO} — ` +
        `${result.healedByPlaceholder} seeded listing(s) fixed without a database write.`
    );
  } else {
    console.log("Seed placeholder artwork was already present.");
  }

  if (result.cleared.length === 0) {
    console.log("No orphaned uploads found.");
  } else {
    console.warn(
      `${dryRun ? "WOULD CLEAR" : "CLEARED"} the photo path on ${result.cleared.length} plate(s) whose upload is not in local storage. ` +
        "These have no code-side source to regenerate from — re-upload the photo, or copy the files over from " +
        "the machine that uploaded them. They now render the generated plate artwork instead of a broken image:"
    );
    for (const plate of result.cleared) {
      console.warn(`  - ${plate.title} (${plate.id}) -> ${plate.image}`);
    }
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Plate image repair failed:", err);
    process.exit(1);
  });
}
