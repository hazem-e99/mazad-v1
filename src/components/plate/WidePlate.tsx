import { PlateLogoIcon } from "@/components/plate/PlateLogoIcon";
import { PlateKsaStrip } from "@/components/plate/PlateKsaStrip";
import { PlateCharacters, PlateDigits } from "@/components/plate/PlateCharacters";
import type { PlateSpec } from "@/components/plate/plateSpec";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

/**
 * The long strip every car carries: four columns reading left to right as
 *
 *   numbers │ logo │ letters │ KSA
 *
 * with the Arabic form of each group stacked above its Latin form. That
 * order is the reference stock's, and it is why the plate container is
 * pinned to `dir="ltr"` — under the site's RTL the columns would mirror
 * into the wrong sequence, while the Arabic text inside each cell still
 * needs its own direction (see PlateCharacters).
 *
 * A plate with no logo drops the emblem column entirely rather than
 * leaving a gap, which is what the client's fifth reference plate shows.
 *
 * All type is sized in `cqi` — a share of the plate's own width — so one
 * markup is correct as a 96px chip and as a 672px hero with no
 * size-specific rules anywhere.
 */
export function WidePlate({
  spec,
  lettersAr,
  lettersEn,
  numbers,
  logo,
  locale = "ar",
  englishOnly = false,
}: {
  spec: PlateSpec;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  locale?: Locale;
  /** Sport plates carry English letters/numbers only (§ Sports Plate rule)
   * — drops the Arabic line from both cells and lets the Latin one take
   * the full cell instead of being the smaller secondary line. */
  englishOnly?: boolean;
}) {
  // Proportions taken off the reference: the character groups dominate,
  // the crest takes a narrow middle, and the strip is a fixed slice.
  // Without a logo the two groups share the space the crest gave up.
  const columns = logo
    ? "minmax(0,1.2fr) minmax(1.5rem,0.58fr) minmax(0,1.3fr) clamp(1.5rem,9.5cqi,4.6rem)"
    : "minmax(0,1fr) minmax(0,1.06fr) clamp(1.5rem,9.5cqi,4.6rem)";

  const arSize = (base: number) => `clamp(0.5rem, ${(base * spec.scale.numbers).toFixed(2)}cqi, 3.8rem)`;
  const enSize = `clamp(0.42rem, ${(5.5 * spec.scale.numbers).toFixed(2)}cqi, 2.8rem)`;
  const arLetterSize = `clamp(0.5rem, ${(7.9 * spec.scale.letters).toFixed(2)}cqi, 4rem)`;
  const enLetterSize = `clamp(0.42rem, ${(5.5 * spec.scale.letters).toFixed(2)}cqi, 2.8rem)`;

  const numbersCol = 1;
  const lettersCol = logo ? 3 : 2;
  const ksaCol = logo ? 4 : 3;

  const logoCell = logo && (
    <div
      className="relative z-10 flex items-center justify-center border-e-[max(1.5px,0.4cqi)] border-[#000] px-[1.2cqi] py-[1cqi]"
      style={{ gridColumn: 2, gridRow: englishOnly ? 1 : "1 / span 2" }}
    >
      <PlateLogoIcon logo={logo} locale={locale} className="max-h-[74%] max-w-[80%] object-contain" />
    </div>
  );

  if (englishOnly) {
    return (
      <div className="relative grid h-full w-full" style={{ gridTemplateColumns: columns, aspectRatio: spec.aspect }}>
        <Cell col={numbersCol} row={1} className="border-e-[max(1.5px,0.4cqi)] border-[#000]">
          <PlateDigits value={numbers} script="en" fontSize={arSize(7.9)} tracking="0.03em" />
        </Cell>
        {logoCell}
        <Cell col={lettersCol} row={1}>
          <PlateCharacters value={lettersEn} script="en" fontSize={arLetterSize} gap="1.9cqi" />
        </Cell>
        <div style={{ gridColumn: ksaCol, gridRow: 1 }}>
          <PlateKsaStrip accent={spec.accent} logo={logo} locale={locale} />
        </div>
      </div>
    );
  }

  // A shared two-row grid, not two independently-centered cells: the
  // divider is a `border-b` on the row-1 track itself, so it lands on the
  // exact same grid line under both the numbers and the letters — lining
  // each cell up on its own (as the wide plate used to) let unequal
  // Arabic/Latin text heights push the two "lines" to different Y
  // positions, which is what made them look broken/offset across the
  // vertical divider. Mirrors SquarePlate's already-correct pattern.
  return (
    <div
      className="relative grid h-full w-full"
      style={{ gridTemplateColumns: columns, gridTemplateRows: "1fr 1fr", aspectRatio: spec.aspect }}
    >
      <Cell col={numbersCol} row={1} className="border-e-[max(1.5px,0.4cqi)] border-b-[max(1.5px,0.9cqi)] border-[#000]">
        <PlateDigits value={numbers} script="ar" fontSize={arSize(7.9)} tracking="0.03em" />
      </Cell>
      <Cell col={lettersCol} row={1} className="border-b-[max(1.5px,0.9cqi)] border-[#000]">
        <PlateCharacters value={lettersAr} script="ar" fontSize={arLetterSize} gap="1.7cqi" />
      </Cell>

      <Cell col={numbersCol} row={2} className="border-e-[max(1.5px,0.4cqi)] border-[#000]">
        <PlateDigits value={numbers} script="en" fontSize={enSize} tracking="0.06em" />
      </Cell>
      <Cell col={lettersCol} row={2}>
        <PlateCharacters value={lettersEn} script="en" fontSize={enLetterSize} gap="1.9cqi" />
      </Cell>

      {logoCell}
      <div style={{ gridColumn: ksaCol, gridRow: "1 / span 2" }}>
        <PlateKsaStrip accent={spec.accent} logo={logo} locale={locale} />
      </div>
    </div>
  );
}

function Cell({
  children,
  col,
  row,
  className = "",
}: {
  children: React.ReactNode;
  col: number;
  row: number;
  className?: string;
}) {
  return (
    <div
      style={{ gridColumn: col, gridRow: row }}
      className={`relative z-10 flex min-w-0 flex-col items-center justify-center overflow-hidden px-[1.4cqi] py-[1cqi] text-center ${className}`}
    >
      {children}
    </div>
  );
}
