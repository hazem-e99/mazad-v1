import { cn } from "@/lib/cn";
import type { PlateType } from "@/lib/constants";
import { PlateLogoIcon } from "@/components/plate/PlateLogoIcon";
import { SaudiEmblem } from "@/components/plate/SaudiEmblem";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

export type PlateSize = "xs" | "sm" | "md" | "lg" | "xl" | "spotlight";

interface SaudiPlateProps {
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  /** xs = navbar chip · sm = tables/search · md = auction cards ·
   *  lg = auction details · xl = featured/hero · spotlight = home stage. */
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
  spotlight: "w-full max-w-[42rem]",
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

/** ZERO WIDTH NON-JOINER. */
const ZWNJ = "‌";

/**
 * Arabic plate letters are stamped as isolated glyphs, never in cursive.
 * Left alone, "ندي" joins into one ligated word; separating the letters
 * with ZWNJ breaks the join while adding nothing the line breaker can wrap
 * on — an ordinary space did both jobs at once, which is why a three-letter
 * group could drop "ص" onto a second line.
 *
 * The visible gap is letter-spacing's job, not the string's. Note that
 * letter-spacing also applies after each ZWNJ, so the rendered gap is twice
 * the tracking value.
 */
function isolatedArabic(value: string): string {
  return value.replace(/\s+/g, "").split("").join(ZWNJ);
}

/** Latin never joins, so it only needs the incoming spacing normalised
 * away — the optical gap comes from tracking. */
function isolatedLatin(value: string): string {
  return value.replace(/\s+/g, "");
}

/**
 * Draws the plate from the record's own letters, numbers and logo.
 *
 * It renders the *data*, never a stock photograph: an earlier revision
 * picked one of five `/images/License*.png` files by hashing the letters,
 * which meant every plate on the site displayed characters belonging to
 * some other plate. A record's real uploaded photo is a separate thing —
 * callers that have one show it instead of this component (see
 * ListingCard / the home page's PlateVisual), and this is what renders
 * when there is none.
 */
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
          // The emblem column's floor is what keeps the crest legible, but
          // a 70px one dominated the plate at card scale — it took ~30% of
          // the width where the real thing gives the crest ~17%, squeezing
          // the characters either side. 2rem holds the smallest render
          // without distorting the larger ones.
          "grid-cols-[minmax(0,1.25fr)_minmax(2rem,0.82fr)_minmax(0,1.25fr)_clamp(1.5rem,9cqi,4.5rem)]",
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
          {/* Arabic descenders (ي, ن, ج) paint well below the baseline and
              overflow a line box set to 1em, landing on the Latin line
              beneath. 1.35 is what actually contains them. */}
          <span className="block whitespace-nowrap font-[900] leading-[1.35] tracking-[0.04em] text-[clamp(0.5rem,7cqi,3.6rem)] text-black">
            {toArabicIndic(numbers)}
          </span>
          {/* Gap sized against the plate's own width (cqi), not this span's
              font-size — an `em` here resolves against the small Latin type
              and collapses to well under a pixel. */}
          <span className="mt-[clamp(0.05rem,1.2cqi,0.6rem)] block whitespace-nowrap font-mono text-[clamp(0.42rem,5.6cqi,2.9rem)] font-black leading-none tracking-[0.08em] text-black/85">
            {numbers}
          </span>
        </div>

        {/* Padding in cqi so the crest keeps clear air on both sides of the
            dividers at every render size, the way it does on real stock. */}
        <div className="saudi-plate__emblem relative z-10 flex items-center justify-center border-e border-black/35 px-[clamp(0.1rem,1.3cqi,0.85rem)] py-[clamp(0.1rem,1cqi,0.7rem)]">
          {/* Sized against the plate's width like the type is, at roughly
              the share of the face the real crest occupies — at 2.5cqi it
              read as a speck next to 7cqi characters. */}
          {logo ? (
            <PlateLogoIcon logo={logo} locale={locale} className="h-[clamp(0.9rem,14cqi,6rem)] w-[clamp(0.9rem,14cqi,6rem)] object-contain text-[#0d5d4a]" />
          ) : (
            <SaudiEmblem className="h-[clamp(0.95rem,15cqi,6.4rem)] w-[clamp(0.95rem,15cqi,6.4rem)] text-[#1a6a59]" />
          )}
        </div>

        <div className="saudi-plate__letters relative z-10 flex min-w-0 flex-col items-center justify-center px-[0.18em] py-[0.1em] text-center">
          {/* The negative inline-end margin cancels the trailing
              letter-spacing that follows the last glyph — without it the
              run sits visibly off-centre in its cell. */}
          <span className="-me-[0.3em] block whitespace-nowrap font-[900] leading-[1.35] tracking-[0.3em] text-[clamp(0.5rem,7cqi,3.6rem)] text-black">
            {isolatedArabic(lettersAr)}
          </span>
          <span className="-me-[0.18em] mt-[clamp(0.05rem,1.2cqi,0.6rem)] block whitespace-nowrap font-mono text-[clamp(0.42rem,5.6cqi,2.9rem)] font-black leading-none tracking-[0.18em] text-black/85">
            {isolatedLatin(lettersEn)}
          </span>
        </div>

        <div className="saudi-plate__ksa relative z-10 flex flex-col items-center justify-center gap-[0.04em] border-s border-black/35 bg-[#f3f3f3] py-[0.08em] text-center">
          <div className="flex h-[clamp(0.6rem,6.5cqi,3rem)] w-[clamp(0.6rem,6.5cqi,3rem)] items-center justify-center text-[#1a6a59]">
            {logo ? (
              <PlateLogoIcon logo={logo} locale={locale} className="h-full w-full object-contain" />
            ) : (
              <SaudiEmblem className="h-full w-full" />
            )}
          </div>
          {/* cqi, not em: an `em` size here resolved against the inherited
              16px and so stayed identical on a 96px chip and a 672px hero. */}
          <span className="font-[900] text-[clamp(0.32rem,3.2cqi,1.7rem)] leading-[1] tracking-[0.06em] text-black/80">K</span>
          <span className="font-[900] text-[clamp(0.32rem,3.2cqi,1.7rem)] leading-[1] tracking-[0.06em] text-black/80">S</span>
          <span className="font-[900] text-[clamp(0.32rem,3.2cqi,1.7rem)] leading-[1] tracking-[0.06em] text-black/80">A</span>
        </div>
      </div>
    </div>
  );
}
