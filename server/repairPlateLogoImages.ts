/**
 * Repairs plate logos whose stored image file is missing from local
 * storage — the rows render as a broken <img> in the admin list and in
 * the plate-creation picker even though the API and the database are
 * perfectly healthy.
 *
 * Why the two drift apart: `image` holds a public path like
 * `/uploads/plate-logos/<uuid>.webp`, and those files are written to
 * gitignored local disk (see UPLOAD_DIR in src/lib/storage.ts) while the
 * PlateLogo documents live in the shared database. Whoever runs
 * `npm run seed` / `npm run migrate:plate-logos` gets both; every other
 * clone pointed at the same database inherits the rows alone.
 *
 * The four legacy catalog logos are generated from SVG source checked
 * into server/plateLogoAssets.ts, so they can simply be re-rasterized.
 * Admin-uploaded logos have no such source — those are reported for
 * manual re-upload instead of being silently blanked.
 *
 * Safe to re-run: logos whose file is present are left untouched.
 *
 * Run with: npm run repair:plate-logos
 * (equivalent to: npx tsx --env-file=.env server/repairPlateLogoImages.ts)
 */
import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { imageExists } from "@/lib/storage";
import { LEGACY_LOGO_SPECS, ensureLegacyPlateLogo } from "./plateLogoAssets";

export interface OrphanedPlateLogo {
  id: string;
  nameAr: string;
  image: string;
}

export interface PlateLogoImageRepairResult {
  checked: number;
  regenerated: string[];
  orphaned: OrphanedPlateLogo[];
}

/** Pure repair logic — assumes the caller already connected to the database. */
export async function runPlateLogoImageRepair(): Promise<PlateLogoImageRepairResult> {
  const legacySlugs = LEGACY_LOGO_SPECS.map((spec) => spec.legacySlug);
  const regenerated: string[] = [];

  for (const spec of LEGACY_LOGO_SPECS) {
    const existing = await PlateLogo.findOne({ legacySlug: spec.legacySlug });
    if (existing && (await imageExists(existing.image))) continue;

    // Re-rasterizes a missing file, and creates the record outright if a
    // partially-run migration never got that far.
    await ensureLegacyPlateLogo(spec, existing?.createdBy ? String(existing.createdBy) : null);
    regenerated.push(spec.legacySlug);
  }

  // `$nin` also matches documents with no legacySlug at all (admin-created
  // ones), which is exactly the set that has no regenerable source.
  const uploaded = await PlateLogo.find({ legacySlug: { $nin: legacySlugs } }).lean<
    { _id: unknown; nameAr: string; image: string }[]
  >();

  const orphaned: OrphanedPlateLogo[] = [];
  for (const logo of uploaded) {
    if (await imageExists(logo.image)) continue;
    orphaned.push({ id: String(logo._id), nameAr: logo.nameAr, image: logo.image });
  }

  return { checked: LEGACY_LOGO_SPECS.length + uploaded.length, regenerated, orphaned };
}

async function main() {
  await connectDB();
  console.log("Checking plate-logo image files...");

  const result = await runPlateLogoImageRepair();
  console.log(`Checked ${result.checked} plate logo(s).`);

  if (result.regenerated.length === 0) {
    console.log("No legacy logo artwork was missing.");
  } else {
    console.log(`Regenerated artwork for ${result.regenerated.length} legacy logo(s):`, result.regenerated);
  }

  if (result.orphaned.length > 0) {
    console.warn(
      "WARNING: these admin-uploaded logos reference a file that is not in local storage. " +
        "They have no code-side source to regenerate from — re-upload the image from " +
        "/admin/plate-logos, or copy the files over from the machine that uploaded them:"
    );
    for (const logo of result.orphaned) {
      console.warn(`  - ${logo.nameAr} (${logo.id}) -> ${logo.image}`);
    }
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Plate-logo image repair failed:", err);
    process.exit(1);
  });
}
