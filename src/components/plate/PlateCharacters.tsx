import type { Locale } from "@/lib/i18n";

/**
 * A run of plate characters.
 *
 * Each glyph is its own element, and that is the point: Arabic is a
 * cursive script, so "نهط" in a single text run ligates into one joined
 * word, while real plate stock stamps every letter in its isolated form.
 * Separate elements are separate text runs, which is what actually forces
 * the isolated shape — a ZERO WIDTH NON-JOINER between the letters does
 * not survive every font's shaping, and an ordinary space gives the line
 * breaker somewhere to wrap.
 *
 * Spacing is then a real `gap` rather than `letter-spacing`, which has no
 * trailing-space artefact to cancel and so centres correctly in its cell
 * without a negative margin.
 */
export function PlateCharacters({
  value,
  script,
  fontSize,
  gap,
  className = "",
  lineHeight,
}: {
  value: string;
  script: "ar" | "en";
  /** CSS length — callers size this against the plate's width in `cqi`. */
  fontSize: string;
  gap: string;
  className?: string;
  lineHeight?: number;
}) {
  const glyphs = value.replace(/\s+/g, "").split("");

  return (
    <span
      // Direction is set per run, never on the plate: the two scripts
      // share a face and only the Arabic one may run right to left.
      dir={script === "ar" ? "rtl" : "ltr"}
      className={`flex min-w-0 items-baseline justify-center whitespace-nowrap font-[800] text-black ${className}`}
      style={{
        fontSize,
        gap,
        // Arabic descenders (ي, ن, ج) paint well below the baseline and a
        // line box set to 1 clips them.
        lineHeight: lineHeight ?? (script === "ar" ? 1.26 : 1),
      }}
    >
      {glyphs.map((glyph, index) => (
        <span key={`${glyph}-${index}`} className="block">
          {script === "en" ? glyph.toUpperCase() : glyph}
        </span>
      ))}
    </span>
  );
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Saudi plates carry the number twice: Arabic-Indic above, Western below. */
export function toArabicIndic(value: string): string {
  return value.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Digits never join, so they are drawn as one run — splitting them would
 * only cost the natural digit tracking the font provides. */
export function PlateDigits({
  value,
  script,
  fontSize,
  tracking,
  className = "",
}: {
  value: string;
  script: "ar" | "en";
  fontSize: string;
  tracking: string;
  className?: string;
  locale?: Locale;
}) {
  return (
    <span
      dir="ltr"
      className={`block whitespace-nowrap font-[800] text-black ${className}`}
      style={{
        fontSize,
        letterSpacing: tracking,
        lineHeight: script === "ar" ? 1.26 : 1,
      }}
    >
      {script === "ar" ? toArabicIndic(value) : value}
    </span>
  );
}
