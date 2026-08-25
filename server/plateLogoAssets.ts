import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSharp } from "@/lib/imageProcessor";
import { saveImageAt } from "@/lib/storage";
import { PlateLogo } from "@/models/PlateLogo";

export interface LegacyLogoSpec {
  legacySlug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  /** Inline placeholder artwork, rasterized via sharp — used only where no
   * real approved asset exists yet. */
  svg?: string;
  /** A real approved asset file, relative to the project root. Takes
   * precedence over `svg` when both are present. */
  sourcePath?: string;
}

function svgDoc(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">${inner}</svg>`;
}

/**
 * The six plate logo options the product requires (§ Plate Logos /
 * Emblems). Four have real approved artwork; the other two
 * (رؤية المملكة 2030, مدائن صالح) have no clean approved asset available
 * yet — see the placeholder note on each — so they fall back to a plain
 * inline placeholder mark until real artwork is supplied. Swapping either
 * in later needs no code change: the admin's existing logo-edit upload
 * (src/app/admin/plate-logos) replaces `image` on the same record.
 *
 * Slugs are kept stable across renames (`swords_palm_green` still reads
 * "ملون", not "أخضر" — see nameAr) so this list's idempotent upsert (keyed
 * on legacySlug, see ensureLegacyPlateLogo below) updates the existing
 * record in place instead of creating a duplicate.
 */
export const LEGACY_LOGO_SPECS: LegacyLogoSpec[] = [
  {
    // No real Vision 2030 emblem asset is available (the supplied
    // logo_01_mosaic.png reference carries a visible stock-photo
    // watermark and can't ship) — placeholder until a clean asset exists.
    legacySlug: "vision",
    nameAr: "رؤية المملكة 2030",
    nameEn: "Saudi Vision 2030",
    sortOrder: 1,
    svg: svgDoc(
      `<circle cx="24" cy="24" r="15" fill="none" stroke="#0f6b4f" stroke-width="2.5" />
       <path d="M24 12v8M24 28v8M12 24h8M28 24h8" fill="none" stroke="#0f6b4f" stroke-width="2.5" stroke-linecap="round" />`
    ),
  },
  {
    legacySlug: "swords_palm_black",
    nameAr: "السيفان والنخلة — أسود",
    nameEn: "Crossed Swords & Palm — Black",
    sortOrder: 2,
    sourcePath: "public/images/logo_02_black.png",
  },
  {
    legacySlug: "swords_palm_green",
    nameAr: "السيفان والنخلة — ملون",
    nameEn: "Crossed Swords & Palm — Colored",
    sortOrder: 3,
    sourcePath: "public/images/logo_03_colored.png",
  },
  {
    // No Madain Saleh asset has ever existed in this project (confirmed
    // absent even from the old hardcoded enum this migration replaces) —
    // placeholder rock-formation mark until real artwork is supplied.
    legacySlug: "madain_saleh",
    nameAr: "مدائن صالح",
    nameEn: "Madain Saleh",
    sortOrder: 4,
    svg: svgDoc(
      `<path d="M6 38l6-14 5 6 4-10 5 8 4-6 6 16z" fill="none" stroke="#8a6d2f" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
       <path d="M4 38h40" stroke="#8a6d2f" stroke-width="2" stroke-linecap="round" />`
    ),
  },
  {
    legacySlug: "diriyah",
    nameAr: "الدرعية",
    nameEn: "Diriyah",
    sortOrder: 5,
    sourcePath: "public/images/brand1.png",
  },
];

/**
 * Produces one legacy mark's real stored image file through the existing
 * upload/storage pipeline (sharp + saveImageAt) — the same path every
 * other upload in the app uses, not a parallel one. A stable key (the
 * legacySlug) rather than a random one, so re-running the seed heals the
 * same SiteAsset row instead of orphaning a new one each time.
 */
async function rasterizeAndSave(spec: LegacyLogoSpec): Promise<string> {
  if (spec.sourcePath) {
    const buffer = await readFile(path.join(process.cwd(), spec.sourcePath));
    return saveImageAt(buffer, "plate-logos", spec.legacySlug);
  }
  const sharp = await getSharp();
  const buffer = await sharp(Buffer.from(spec.svg!)).png().toBuffer();
  return saveImageAt(buffer, "plate-logos", spec.legacySlug);
}

/**
 * Idempotently ensures a PlateLogo record exists for the given legacy
 * enum value, with up-to-date name/art — safe to call repeatedly (used by
 * the dev seed, the one-time migration script and the image repair
 * script) since it upserts on the stable `legacySlug`, never creating a
 * duplicate, and `rasterizeAndSave` writes to a stable SiteAsset key so
 * re-running never orphans a previous row.
 *
 * Always refreshes `nameAr`/`nameEn`/`sortOrder`/`image` on an existing
 * record rather than short-circuiting when one is found: this is what
 * lets correcting a name or swapping placeholder art for a real asset
 * (edit LEGACY_LOGO_SPECS, re-run) actually take effect on already-seeded
 * records instead of only affecting brand-new ones.
 */
export async function ensureLegacyPlateLogo(spec: LegacyLogoSpec, createdBy: string | null) {
  const image = await rasterizeAndSave(spec);
  const existing = await PlateLogo.findOne({ legacySlug: spec.legacySlug });
  if (existing) {
    existing.nameAr = spec.nameAr;
    existing.nameEn = spec.nameEn;
    existing.sortOrder = spec.sortOrder;
    existing.image = image;
    await existing.save();
    return existing;
  }

  return PlateLogo.create({
    nameAr: spec.nameAr,
    nameEn: spec.nameEn,
    image,
    isActive: true,
    sortOrder: spec.sortOrder,
    legacySlug: spec.legacySlug,
    createdBy,
  });
}
