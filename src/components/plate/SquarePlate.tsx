import { PlateKsaStrip } from "@/components/plate/PlateKsaStrip";
import { PlateCharacters, PlateDigits } from "@/components/plate/PlateCharacters";
import type { PlateSpec } from "@/components/plate/plateSpec";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

/**
 * The short stock — small square and small sport — which is a different
 * plate, not a narrower version of the long one.
 *
 * Where the wide plate spreads four columns across a single band, this
 * splits the face into two rows and lets the KSA strip span both:
 *
 *   numbers (ar) │ letters (ar) │ K
 *   ─────────────┼──────────────┤ S
 *   numbers (en) │ letters (en) │ A
 *
 * so each script gets a row of its own rather than being stacked inside a
 * cell. Every cell is placed explicitly: with auto-placement the strip's
 * row span pushed the Latin row out of the grid entirely and the
 * characters spilled past the plate edge.
 *
 * There is no emblem column at this size — the logo travels in the strip,
 * exactly as it does on real small stock — so nothing floats over the
 * characters.
 */
export function SquarePlate({
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
  /** See WidePlate's `englishOnly` — same sport-plate rule, single-row
   * layout instead of the usual Arabic-over-Latin two rows, and drops the
   * KSA strip column entirely. */
  englishOnly?: boolean;
}) {
  const arNumbers = `clamp(0.5rem, ${(12 * spec.scale.numbers).toFixed(2)}cqi, 3.4rem)`;
  const enNumbers = `clamp(0.45rem, ${(10 * spec.scale.numbers).toFixed(2)}cqi, 2.9rem)`;
  const arLetters = `clamp(0.5rem, ${(12 * spec.scale.letters).toFixed(2)}cqi, 3.4rem)`;
  const enLetters = `clamp(0.45rem, ${(10 * spec.scale.letters).toFixed(2)}cqi, 2.9rem)`;

  if (englishOnly) {
    return (
      <div
        className="relative grid h-full w-full"
        style={{
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1.12fr)",
          aspectRatio: spec.aspect,
        }}
      >
        <Cell col={1} row={1} className="border-e-[max(1.5px,0.5cqi)] border-[#000]">
          <PlateDigits value={numbers} script="en" fontSize={arNumbers} tracking="0.03em" />
        </Cell>
        <Cell col={2} row={1}>
          <PlateCharacters value={lettersEn} script="en" fontSize={arLetters} gap="1.6cqi" />
        </Cell>
      </div>
    );
  }

  return (
    <div
      className="relative grid h-full w-full"
      style={{
        gridTemplateColumns: "minmax(0,1fr) minmax(0,1.12fr) clamp(1.4rem,15cqi,5rem)",
        gridTemplateRows: "1fr 1fr",
        aspectRatio: spec.aspect,
      }}
    >
      {/* ── Row 1: Arabic ─────────────────────────────────────────── */}
      <Cell col={1} row={1} className="border-e-[max(1.5px,0.5cqi)] border-b-[max(1.5px,0.5cqi)] border-[#000]">
        <PlateDigits value={numbers} script="ar" fontSize={arNumbers} tracking="0.03em" />
      </Cell>
      <Cell col={2} row={1} className="border-b-[max(1.5px,0.5cqi)] border-[#000]">
        <PlateCharacters value={lettersAr} script="ar" fontSize={arLetters} gap="1.6cqi" />
      </Cell>

      {/* ── Row 2: Latin ──────────────────────────────────────────── */}
      <Cell col={1} row={2} className="border-e-[max(1.5px,0.5cqi)] border-[#000]">
        <PlateDigits value={numbers} script="en" fontSize={enNumbers} tracking="0.06em" />
      </Cell>
      <Cell col={2} row={2}>
        <PlateCharacters value={lettersEn} script="en" fontSize={enLetters} gap="1.9cqi" />
      </Cell>

      {/* The strip owns the full height of both rows. */}
      <div style={{ gridColumn: 3, gridRow: "1 / span 2" }}>
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
      className={`relative z-10 flex min-w-0 items-center justify-center overflow-hidden px-[2cqi] text-center ${className}`}
    >
      {children}
    </div>
  );
}
