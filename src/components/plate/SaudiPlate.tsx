import { cn } from "@/lib/cn";
import type { PlateType } from "@/lib/constants";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";
import { getPlateImageAsset } from "@/components/plate/plateImage";

export type PlateSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SaudiPlateProps {
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  /** xs = navbar chip · sm = tables/search · md = auction cards ·
   *  lg = auction details · xl = featured/hero. */
  size?: PlateSize;
  className?: string;
  /** Adds the gold presentation ring reserved for VIP listings. */
  vip?: boolean;
  /** Selected state for pickers (admin auction builder, add-plate flow). */
  selected?: boolean;
  /** Defaults to "ar" for callers without locale context — this component
   * has no "use client" directive so it can render from server
   * components. Pass the active locale for a correct accessible name. */
  locale?: Locale;
}

/* Every internal dimension is expressed in `em`, and the plate's font-size
   is a percentage of its own container width (`cqi`). One width therefore
   drives the whole composition, so the same markup is pixel-correct as a
   104px navbar chip and as a 420px hero plate — no duplicated markup per
   size, and no size-specific magic numbers to keep in sync. */
const sizeWidth: Record<PlateSize, string> = {
  xs: "w-24",
  sm: "w-40",
  md: "w-56",
  lg: "w-72",
  xl: "w-full max-w-[28rem]",
};

/* Real Saudi plate stock comes in a few physical formats; the aspect ratio
   is what visually distinguishes them, so it is driven by the plate's own
   type rather than by the render size. */
const typeAspect: Record<PlateType, string> = {
  private: "aspect-[5/1]",
  individual: "aspect-[5/1]",
  transfer: "aspect-[5/1]",
  sport: "aspect-[4.8/1]",
  wide: "aspect-[5.6/1]",
  small_square: "aspect-[2.2/1]",
  small_sport: "aspect-[2.5/1]",
};

const PLATE_WORD: Record<Locale, string> = { ar: "لوحة", en: "Plate" };
const NO_LOGO_WORD: Record<Locale, string> = { ar: "بلا شعار", en: "No Logo" };

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Saudi plates carry the number twice: Arabic-Indic on the Arabic line,
 * Western on the Latin line below it. */
function toArabicIndic(value: string): string {
  return value.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Plate characters are set with wide optical spacing on the real thing.
 * Inputs arrive either already spaced ("أ ب ج") or not ("ABC"), so
 * normalise to a single form and let CSS own the tracking. */
function spaced(value: string): string {
  return value.replace(/\s+/g, "").split("").join(" ");
}

export function SaudiPlate({
  type,
  lettersAr,
  lettersEn,
  numbers,
  logo,
  size = "md",
  className,
  vip = false,
  selected = false,
  locale = "ar",
}: SaudiPlateProps) {
  const logoName = logo ? (locale === "en" ? logo.nameEn : logo.nameAr) : NO_LOGO_WORD[locale];
  const label = `${PLATE_WORD[locale]} ${lettersAr} ${numbers} — ${logoName}`;
  const imageSrc = getPlateImageAsset(lettersAr || lettersEn || "THN", numbers || "970");

  return (
    <div className={cn("@container shrink-0", sizeWidth[size], className)}>
      <img
        src={imageSrc}
        alt={label}
        className={cn(
          "block h-auto w-full select-none object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
          typeAspect[type],
          vip && "ring-[0.05em] ring-(--color-gold)/70",
          selected && "ring-[0.08em] ring-(--color-gold)"
        )}
        draggable={false}
      />
    </div>
  );
}
