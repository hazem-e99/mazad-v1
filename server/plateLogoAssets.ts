import sharp from "sharp";
import { saveImage } from "@/lib/storage";
import { PlateLogo } from "@/models/PlateLogo";

export interface LegacyLogoSpec {
  legacySlug: string;
  nameAr: string;
  nameEn: string;
  svg: string;
  sortOrder: number;
}

function svgDoc(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">${inner}</svg>`;
}

function swordsPalmPaths(color: string) {
  return `<path d="M24 6c-1.5 4-1.5 9 0 13-1.5-4-1.5 9 0-13z" fill="${color}" />
    <path d="M24 8v14" stroke="${color}" stroke-width="1.6" stroke-linecap="round" />
    <ellipse cx="24" cy="9" rx="6" ry="3.2" fill="${color}" />
    <path d="M12 40l10-20 2 1-9 20z" fill="${color}" />
    <path d="M36 40L26 20l-2 1 9 20z" fill="${color}" />
    <path d="M9 41h30" stroke="${color}" stroke-width="2" stroke-linecap="round" />`;
}

/**
 * The exact shapes the old hardcoded PlateLogoIcon switch/case used to
 * draw inline for each legacy enum value — reused here (not reinvented)
 * so the one-time migration and the dev seed both produce real logo
 * artwork instead of a placeholder image.
 */
export const LEGACY_LOGO_SPECS: LegacyLogoSpec[] = [
  {
    legacySlug: "vision",
    nameAr: "شعار الرؤية",
    nameEn: "Vision Emblem",
    sortOrder: 1,
    svg: svgDoc(
      `<circle cx="24" cy="24" r="15" fill="none" stroke="#0f6b4f" stroke-width="2.5" />
       <path d="M24 12v8M24 28v8M12 24h8M28 24h8" fill="none" stroke="#0f6b4f" stroke-width="2.5" stroke-linecap="round" />`
    ),
  },
  {
    legacySlug: "swords_palm_black",
    nameAr: "سيفين ونخلة أسود",
    nameEn: "Crossed Swords & Palm (Black)",
    sortOrder: 2,
    svg: svgDoc(swordsPalmPaths("#151515")),
  },
  {
    legacySlug: "swords_palm_green",
    nameAr: "سيفين ونخلة أخضر",
    nameEn: "Crossed Swords & Palm (Green)",
    sortOrder: 3,
    svg: svgDoc(swordsPalmPaths("#0f6b4f")),
  },
  {
    legacySlug: "diriyah",
    nameAr: "الدرعية",
    nameEn: "Diriyah",
    sortOrder: 4,
    svg: svgDoc(
      `<rect x="10" y="22" width="6" height="16" fill="#8a6d2f" />
       <rect x="18" y="16" width="6" height="22" fill="#8a6d2f" />
       <rect x="26" y="20" width="6" height="18" fill="#8a6d2f" />
       <rect x="34" y="12" width="6" height="26" fill="#8a6d2f" />
       <path d="M8 38h32" stroke="#8a6d2f" stroke-width="2" stroke-linecap="round" />`
    ),
  },
];

/**
 * Rasterizes one of the legacy SVG marks into a real stored image file
 * through the existing upload/storage pipeline (sharp + saveImage) — the
 * same path every other upload in the app uses, not a parallel one.
 */
async function rasterizeAndSave(svg: string, filename: string): Promise<string> {
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const file = new File([new Uint8Array(pngBuffer)], filename, { type: "image/png" });
  return saveImage(file, "plate-logos");
}

/**
 * Idempotently ensures a PlateLogo record exists for the given legacy
 * enum value — safe to call repeatedly (used by both the dev seed and the
 * one-time migration script) since it upserts on the stable
 * `legacySlug`, never creating a duplicate.
 */
export async function ensureLegacyPlateLogo(spec: LegacyLogoSpec, createdBy: string | null) {
  const existing = await PlateLogo.findOne({ legacySlug: spec.legacySlug });
  if (existing) return existing;

  const image = await rasterizeAndSave(spec.svg, `${spec.legacySlug}.png`);
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
