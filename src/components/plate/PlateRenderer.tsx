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

  // The xs variant is a compact identification chip (header VIP strip) —
  // full plate chrome (country text, English sub-line) doesn't fit
  // legibly at that scale, so it shows only the core letters/numbers.
  if (size === "xs") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center gap-1.5 rounded-md border-black bg-white text-black shadow-inner select-none overflow-hidden px-1.5",
          sizeClasses.xs,
          className
        )}
        role="img"
        aria-label={label}
      >
        {logo && <PlateLogoIcon logo={logo} locale={locale} className="h-[1.3em] w-[1.3em] shrink-0 object-contain" />}
        <span className="font-mono font-bold leading-none" dir="rtl">
          {lettersAr}
        </span>
        <span className="h-[60%] w-px bg-black/40 shrink-0" aria-hidden="true" />
        <span className="font-mono font-bold leading-none" dir="ltr">
          {numbers}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-md border-black bg-white text-black shadow-inner select-none overflow-hidden",
        sizeClasses[size],
        shapeOverrides[type],
        className
      )}
      role="img"
      aria-label={label}
    >
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[0.55em] font-bold tracking-wide">المملكة العربية السعودية</span>
        {logo && <PlateLogoIcon logo={logo} locale={locale} className="h-[1.4em] w-[1.4em] object-contain" />}
      </div>

      <div className="flex flex-1 items-center justify-center gap-3 px-2 font-mono font-bold leading-none">
        <span dir="rtl">{lettersAr}</span>
        <span className="h-[70%] w-px bg-black/40" aria-hidden="true" />
        <span dir="ltr">{numbers}</span>
      </div>

      <div className="flex items-center justify-center pb-1">
        <span className="text-[0.5em] font-semibold tracking-[0.3em] text-black/70">{lettersEn}</span>
      </div>
    </div>
  );
}
