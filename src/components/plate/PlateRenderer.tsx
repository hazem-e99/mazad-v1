import { cn } from "@/lib/cn";
import type { PlateType } from "@/lib/constants";
import { PlateLogoIcon } from "@/components/plate/PlateLogoIcon";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

interface PlateRendererProps {
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Defaults to "ar" for callers that don't have locale context handy (this
   * component has no "use client" directive so it can render from server
   * components); pass the active locale explicitly for a correct
   * accessible name in English mode. */
  locale?: Locale;
}

const sizeClasses = {
  xs: "w-24 h-9 text-[0.65rem] border-2",
  sm: "w-40 h-14 text-lg border-[3px]",
  md: "w-56 h-20 text-2xl border-[3px]",
  lg: "w-80 h-28 text-4xl border-[3px]",
  xl: "w-full max-w-[26rem] h-20 sm:h-28 lg:h-36 text-xl sm:text-3xl lg:text-5xl border-2 sm:border-[3px] lg:border-4",
};

// Wide/small-square/small-sport plates use a squarer aspect than standard ones.
const shapeOverrides: Partial<Record<PlateType, string>> = {
  wide: "aspect-[3/1]",
  small_square: "aspect-[2/1.3]",
  small_sport: "aspect-[2/1.3]",
};

const PLATE_WORD: Record<Locale, string> = { ar: "لوحة", en: "Plate" };
const NO_LOGO_WORD: Record<Locale, string> = { ar: "بلا شعار", en: "No Logo" };
const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicIndic(value: string): string {
  return value.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

function spaced(value: string): string {
  return value.replace(/\s+/g, "").split("").join(" ");
}

export function PlateRenderer({
  type,
  lettersAr,
  lettersEn,
  numbers,
  logo,
  size = "md",
  className,
  locale = "ar",
}: PlateRendererProps) {
  const logoName = logo ? (locale === "en" ? logo.nameEn : logo.nameAr) : NO_LOGO_WORD[locale];
  const label = `${PLATE_WORD[locale]} ${lettersAr} ${numbers} - ${logoName}`;

  if (size === "xs") {
    return (
      <div
        className={cn(
          "relative grid w-24 select-none overflow-hidden rounded-[0.32em] border-[0.065em] border-black bg-[#f4f4f4] text-black shadow-inner",
          "grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-1.5 py-1",
          className
        )}
        role="img"
        aria-label={label}
        dir="ltr"
      >
        <div className="flex items-center justify-center">
          {logo ? (
            <PlateLogoIcon logo={logo} locale={locale} className="h-[1.3em] w-[1.3em] object-contain" />
          ) : (
            <span className="text-[0.85em] font-black">KSA</span>
          )}
        </div>
        <span className="h-[70%] w-px bg-black/35" aria-hidden="true" />
        <div className="flex items-center justify-center gap-1 font-mono text-[0.8em] font-black leading-none">
          <span>{toArabicIndic(numbers)}</span>
          <span className="text-[0.7em]">{numbers}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "saudi-plate relative grid w-full select-none overflow-hidden rounded-[0.32em] border-[0.065em] border-black bg-[#f4f4f4] text-[#121212] shadow-(--shadow-plate)",
        "grid-cols-[minmax(0,1.25fr)_minmax(70px,0.82fr)_minmax(0,1.25fr)_2.5rem]",
        sizeClasses[size],
        shapeOverrides[type],
        className
      )}
      role="img"
      aria-label={label}
      dir="ltr"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[0.3em] shadow-[inset_0_0.06em_0_rgba(255,255,255,.95),inset_0_-0.09em_0.18em_rgba(0,0,0,.2)]" />

      <div className="saudi-plate__numbers relative z-10 flex min-w-0 flex-col items-center justify-center border-e border-black/35 px-[0.2em] py-[0.1em] text-center">
        <span className="block font-[900] leading-none tracking-[0.02em] text-[clamp(0.8rem,2.1cqi,3rem)] text-black">{toArabicIndic(numbers)}</span>
        <span className="mt-[0.08em] block font-mono text-[clamp(0.44rem,1.1cqi,1.7rem)] font-black leading-none tracking-[0.08em] text-black/85">
          {numbers}
        </span>
      </div>

      <div className="saudi-plate__emblem relative z-10 flex items-center justify-center border-e border-black/35 py-[0.12em]">
        {logo ? (
          <PlateLogoIcon logo={logo} locale={locale} className="h-[clamp(1.2rem,2.5cqi,2.8rem)] w-[clamp(1.2rem,2.5cqi,2.8rem)] object-contain text-[#0d5d4a]" />
        ) : (
          <span className="h-[clamp(1.4rem,2.9cqi,3.2rem)] w-[clamp(1.4rem,2.9cqi,3.2rem)] rounded-full border border-[#1a6a59] bg-[#eafaf3] text-center text-[0.7em] font-black text-[#1a6a59] leading-[3.2rem]">
            KSA
          </span>
        )}
      </div>

      <div className="saudi-plate__letters relative z-10 flex min-w-0 flex-col items-center justify-center px-[0.18em] py-[0.1em] text-center">
        <span className="block font-[900] leading-none tracking-[0.02em] text-[clamp(0.9rem,2.2cqi,3.1rem)] text-black">{spaced(lettersAr)}</span>
        <span className="mt-[0.08em] block font-mono text-[clamp(0.48rem,1.15cqi,1.8rem)] font-black leading-none tracking-[0.1em] text-black/85">
          {spaced(lettersEn)}
        </span>
      </div>

      <div className="saudi-plate__ksa relative z-10 flex flex-col items-center justify-center gap-[0.04em] border-s border-black/35 bg-[#f3f3f3] py-[0.08em] text-center">
        <div className="flex h-[clamp(0.9rem,1.7cqi,1.8rem)] w-[clamp(0.9rem,1.7cqi,1.8rem)] items-center justify-center text-[#1a6a59]">
          {logo ? (
            <PlateLogoIcon logo={logo} locale={locale} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[0.7em] font-black">K</span>
          )}
        </div>
        <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">K</span>
        <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">S</span>
        <span className="font-[900] text-[0.45em] leading-[0.9] tracking-[0.08em] text-black/80">A</span>
      </div>
    </div>
  );
}
