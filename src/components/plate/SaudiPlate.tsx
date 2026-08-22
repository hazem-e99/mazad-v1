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
  xs: "w-26",
  sm: "w-42",
  md: "w-56",
  lg: "w-76",
  xl: "w-full max-w-[26rem]",
};

/* Real Saudi plate stock comes in a few physical formats; the aspect ratio
   is what visually distinguishes them, so it is driven by the plate's own
   type rather than by the render size. */
const typeAspect: Record<PlateType, string> = {
  private: "aspect-[2.3/1]",
  individual: "aspect-[2.3/1]",
  transfer: "aspect-[2.3/1]",
  sport: "aspect-[2.3/1]",
  wide: "aspect-[3.1/1]",
  small_square: "aspect-[1.55/1]",
  small_sport: "aspect-[1.8/1]",
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
        // Always LTR: a physical Saudi plate reads [KSA strip][numbers]
        // [letters] left-to-right no matter which language the surrounding
        // page is in, so this subtree opts out of the document direction.
        dir="ltr"
        role="img"
        aria-label={label}
        className={cn(
          "relative flex w-full select-none overflow-hidden text-[7.4cqi] leading-none",
          "rounded-[0.34em] border-[0.055em] border-black/75",
          "bg-[linear-gradient(180deg,#ffffff_0%,#f6f7f9_46%,#e6e9ee_100%)] text-[#101418]",
          "shadow-(--shadow-plate)",
          "transition-transform duration-(--duration-base) ease-(--ease-out-expo)",
          typeAspect[type],
          vip && "ring-[0.05em] ring-(--color-gold)/70",
          selected && "ring-[0.08em] ring-(--color-gold)"
        )}
      >
        {/* Pressed-metal lighting: a bright top bevel and a soft floor
            shadow, applied as one inset rather than a border so the plate
            edge stays a hairline at every size. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[0.3em] shadow-[inset_0_0.06em_0_rgba(255,255,255,.95),inset_0_-0.09em_0.14em_rgba(0,0,0,.22)]"
        />

        {/* ── KSA identity strip ─────────────────────────────────────── */}
        <div className="relative flex w-[0.98em] shrink-0 flex-col items-center justify-center gap-[0.1em] border-e-[0.03em] border-black/25 py-[0.14em]">
          {logo ? (
            <PlateLogoIcon logo={logo} locale={locale} className="h-[0.62em] w-[0.62em] object-contain" />
          ) : (
            <SaudiEmblem className="h-[0.62em] w-[0.62em] text-[#12694f]" />
          )}
          <span
            aria-hidden="true"
            className="flex flex-col items-center text-[0.24em] font-bold leading-[1.15] tracking-[0.04em] text-black/80"
          >
            <span>K</span>
            <span>S</span>
            <span>A</span>
          </span>
        </div>

        {/* ── Main face ──────────────────────────────────────────────── */}
        <div className="relative flex min-w-0 flex-1 flex-col justify-center px-[0.22em]">
          {/* Country line — dropped below ~150px where it would be sub-pixel. */}
          <span
            aria-hidden="true"
            className="hidden @min-[150px]:block truncate pb-[0.06em] text-center text-[0.2em] font-semibold tracking-[0.02em] text-black/65"
          >
            المملكة العربية السعودية
          </span>

          <div className="flex flex-1 items-center justify-center gap-[0.16em] pb-[0.04em]">
            <PlateGroup
              arabic={toArabicIndic(numbers)}
              latin={numbers}
              // Digits stay unspaced: they are read as one number, and
              // tracking them apart makes "1 1 2" scan as three values.
              tracking="tracking-[0.02em]"
            />

            <span aria-hidden="true" className="h-[0.72em] w-[0.028em] shrink-0 self-center bg-black/35" />

            <PlateGroup arabic={spaced(lettersAr)} latin={spaced(lettersEn)} tracking="tracking-[0.04em]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One character group (numbers or letters): the Arabic form on top, its
 * Latin counterpart beneath — the layout every Saudi plate uses. */
function PlateGroup({ arabic, latin, tracking }: { arabic: string; latin: string; tracking: string }) {
  return (
    <span className="flex min-w-0 flex-col items-center justify-center">
      <span
        aria-hidden="true"
        className={cn(
          "truncate font-bold leading-none text-[0.5em]",
          // Engraved-on-metal: a single bright edge under the glyph. Kept
          // to one shadow so the type stays crisp, not embossed-plastic.
          "[text-shadow:0_0.02em_0_rgba(255,255,255,.9)]",
          tracking
        )}
      >
        {arabic}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "hidden @min-[118px]:block truncate pt-[0.03em] font-mono text-[0.26em] font-bold leading-none text-black/80",
          tracking
        )}
      >
        {latin}
      </span>
    </span>
  );
}
