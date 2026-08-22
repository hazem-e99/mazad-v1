import { cn } from "@/lib/cn";
import type { PlateType } from "@/lib/constants";
import { PlateLogoIcon } from "@/components/plate/PlateLogoIcon";
import { SaudiEmblem } from "@/components/plate/SaudiEmblem";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

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

  return (
    <div className={cn("@container shrink-0", sizeWidth[size], className)}>
      <div
        dir="ltr"
        role="img"
        aria-label={label}
        className={cn(
          "saudi-plate relative grid w-full select-none overflow-hidden rounded-[0.32em] border-[0.065em] border-black bg-[#f4f4f4] text-[#121212] shadow-(--shadow-plate)",
          "grid-cols-[minmax(0,1.25fr)_minmax(70px,0.82fr)_minmax(0,1.25fr)_2.5rem]",
          "transition-transform duration-(--duration-base) ease-(--ease-out-expo)",
          typeAspect[type],
          vip && "ring-[0.05em] ring-(--color-gold)/70",
          selected && "ring-[0.08em] ring-(--color-gold)"
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[0.3em] shadow-[inset_0_0.06em_0_rgba(255,255,255,.95),inset_0_-0.09em_0.18em_rgba(0,0,0,.2)]"
        />

        <div className="saudi-plate__numbers relative z-10 flex min-w-0 flex-col items-center justify-center border-e border-black/35 px-[0.2em] py-[0.1em] text-center">
          <span className="block font-[900] leading-none tracking-[0.02em] text-[clamp(0.8rem,2.1cqi,3rem)] text-black">
            {toArabicIndic(numbers)}
          </span>
          <span className="mt-[0.08em] block font-mono text-[clamp(0.44rem,1.1cqi,1.7rem)] font-black leading-none tracking-[0.08em] text-black/85">
            {numbers}
          </span>
        </div>

        <div className="saudi-plate__emblem relative z-10 flex items-center justify-center border-e border-black/35 py-[0.12em]">
          {logo ? (
            <PlateLogoIcon logo={logo} locale={locale} className="h-[clamp(1.2rem,2.5cqi,2.8rem)] w-[clamp(1.2rem,2.5cqi,2.8rem)] object-contain text-[#0d5d4a]" />
          ) : (
            <SaudiEmblem className="h-[clamp(1.4rem,2.9cqi,3.2rem)] w-[clamp(1.4rem,2.9cqi,3.2rem)] text-[#1a6a59]" />
          )}
        </div>

        <div className="saudi-plate__letters relative z-10 flex min-w-0 flex-col items-center justify-center px-[0.18em] py-[0.1em] text-center">
          <span className="block font-[900] leading-none tracking-[0.02em] text-[clamp(0.9rem,2.2cqi,3.1rem)] text-black">
            {spaced(lettersAr)}
          </span>
          <span className="mt-[0.08em] block font-mono text-[clamp(0.48rem,1.15cqi,1.8rem)] font-black leading-none tracking-[0.1em] text-black/85">
            {spaced(lettersEn)}
          </span>
        </div>

        <div className="saudi-plate__ksa relative z-10 flex flex-col items-center justify-center gap-[0.04em] border-s border-black/35 bg-[#f3f3f3] py-[0.08em] text-center">
          <div className="flex h-[clamp(0.9rem,1.7cqi,1.8rem)] w-[clamp(0.9rem,1.7cqi,1.8rem)] items-center justify-center text-[#1a6a59]">
            {logo ? (
              <PlateLogoIcon logo={logo} locale={locale} className="h-full w-full object-contain" />
            ) : (
              <SaudiEmblem className="h-full w-full" />
            )}
          </div>
          <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">K</span>
          <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">S</span>
          <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">A</span>
        </div>
      </div>
    </div>
  );
}
