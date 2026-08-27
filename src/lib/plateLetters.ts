/**
 * The Arabic → Latin letter mapping for vehicle plates.
 *
 * A plate's letters may be any of 23 Arabic letters, entered by a user or
 * by an admin. The five letters whose standard transliteration needs two
 * Latin characters — ث (Th), خ (Kh), ذ (Dh), ش (Sh), غ (Gh) — are
 * deliberately left out, so every plate letter maps to exactly one Latin
 * character. Each allowed letter is wired to its Latin equivalent by the
 * table below — the only place that mapping is allowed to live: the
 * server derives `lettersEn` from `lettersAr` through this map at every
 * write path (see the plate schema's transform in validation.ts), and the
 * client mirrors the same map for the live preview. Neither side may
 * invent its own answer.
 *
 * Source of truth is Arabic. A plate's Latin letters are not independent
 * data — they are what this table says the Arabic letters transliterate
 * to, full stop.
 *
 * Several Arabic letters deliberately share a Latin value (ت/ط → T,
 * س/ص → S, د/ض → D, ز/ظ → Z, ح/ه → H); the derivation is one-way only and
 * is never reversed back to Arabic.
 */

/**
 * Input normalisation. The alef spellings (أ إ آ ٱ), the "هـ" tatweel
 * form, ة and ى all fold to one canonical letter before lookup — so a
 * plate typed on any keyboard validates and transliterates the same way,
 * and every record written before the alphabet was widened (those used
 * "أ" and "هـ") still resolves.
 */
const LETTER_ALIASES: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ة": "ه",
  "ى": "ي",
};

/**
 * Every plate-legal Arabic letter, wired to its Latin transliteration.
 * ث خ ذ ش غ are intentionally absent (see the file header) — every value
 * here is a single Latin character, and the rest of the plate code
 * (rendering, width scaling, the 4-character sport limit) relies on that.
 */
export const PLATE_LETTER_MAP: Record<string, string> = {
  "ا": "A",
  "ب": "B",
  "ت": "T",
  "ج": "J",
  "ح": "H",
  "د": "D",
  "ر": "R",
  "ز": "Z",
  "س": "S",
  "ص": "S",
  "ض": "D",
  "ط": "T",
  "ظ": "Z",
  "ع": "E",
  "ف": "F",
  "ق": "Q",
  "ك": "K",
  "ل": "L",
  "م": "M",
  "ن": "N",
  "ه": "H",
  "و": "W",
  "ي": "Y",
};

/** The canonical Arabic letters, in alphabet order. */
export const PLATE_LETTERS_AR = Object.keys(PLATE_LETTER_MAP);
export type PlateLetterAr = keyof typeof PLATE_LETTER_MAP;

const LETTER_SET = new Set<string>(PLATE_LETTERS_AR);

/** Folds an input glyph to its canonical plate letter (see LETTER_ALIASES). */
function normalizeLetter(ch: string): string {
  return LETTER_ALIASES[ch] ?? ch;
}

/**
 * Splits a plate's Arabic letter field into individual plate letters.
 *
 * "هـ" (ه + tatweel) is two Unicode code points standing for one plate
 * letter, so it is matched first before falling back to a single code
 * point; every other letter is one code point. Each glyph is run through
 * normalizeLetter, so alef/ة/ى variants and the tatweel spelling all come
 * back as their canonical form.
 */
export function splitPlateLetters(value: string): string[] {
  const compact = value.replace(/\s+/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < compact.length) {
    if (compact.slice(i, i + 2) === "هـ") {
      out.push("ه");
      i += 2;
      continue;
    }
    out.push(normalizeLetter(compact[i]));
    i += 1;
  }
  return out;
}

/** Whether an Arabic letters field holds 1–4 letters, each drawn from the
 * Arabic alphabet — used by both the client's inline validation and the
 * server schema, so the two can never disagree on what is allowed. */
export function isValidPlateLettersAr(value: string): boolean {
  const glyphs = splitPlateLetters(value);
  return glyphs.length > 0 && glyphs.length <= 4 && glyphs.every((g) => LETTER_SET.has(g));
}

/**
 * Derives the Latin letters from a plate-legal Arabic string.
 *
 * Returns `null` for input that fails isValidPlateLettersAr rather than
 * producing a partial or best-guess result — callers on both sides
 * reject the write in that case instead of saving a mismatch.
 */
export function deriveLettersEn(lettersAr: string): string | null {
  if (!isValidPlateLettersAr(lettersAr)) return null;
  return (
    splitPlateLetters(lettersAr)
      .map((g) => PLATE_LETTER_MAP[g])
      // Reversed on purpose. Arabic reads right to left, so the letter
      // written first is stamped at the *right* of the plate, while the
      // Latin line beneath is read left to right from that same position.
      // The client references confirm the flip: "ن هـ ط" is stamped
      // "T H N".
      .reverse()
      .join("")
  );
}
