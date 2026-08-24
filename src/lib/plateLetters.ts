/**
 * The Arabic <-> Latin letter mapping for Saudi vehicle plates.
 *
 * Saudi plates draw their letters from one fixed set of 17 Arabic
 * characters, each wired to one specific Latin letter by the Ministry of
 * Interior's own transliteration table (the pairing is fixed, not a
 * general Arabic romanisation - several common Arabic letters, like th
 * or dh, never appear on a plate at all). This is that table, and it is
 * the only place it is allowed to live: the server derives lettersEn
 * from lettersAr through this map at the write path (see the plate
 * schema's transform), and the client mirrors the same map for the live
 * preview. Neither may invent its own answer.
 *
 * Source of truth is Arabic. A plate's Latin letters are not independent
 * data - they are what this table says the Arabic letters transliterate
 * to, full stop.
 */
export const PLATE_LETTERS_AR = [
  "أ",
  "ب",
  "ح",
  "د",
  "ر",
  "س",
  "ص",
  "ط",
  "ع",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "هـ",
  "و",
  "ي",
] as const;
export type PlateLetterAr = (typeof PLATE_LETTERS_AR)[number];

/** Every letter above, wired to its one official Latin equivalent. */
export const PLATE_LETTER_MAP: Record<PlateLetterAr, string> = {
  "أ": "A",
  "ب": "B",
  "ح": "J",
  "د": "D",
  "ر": "R",
  "س": "S",
  "ص": "X",
  "ط": "T",
  "ع": "E",
  "ق": "G",
  "ك": "K",
  "ل": "L",
  "م": "Z",
  "ن": "N",
  "هـ": "H",
  "و": "U",
  "ي": "V",
};

const LETTER_SET = new Set<string>(PLATE_LETTERS_AR);

/**
 * Splits a plate's Arabic letter field into individual plate letters.
 *
 * "هـ" (ه + tatweel) is two Unicode code points standing for one plate
 * letter, so a naive character-by-character split treats it as two
 * unknown glyphs - this checks for it first before falling back to a
 * single code point. A bare "ه" - what every normal Arabic keyboard
 * actually produces, since nobody types a tatweel by hand - is folded
 * into the same "هـ" plate letter rather than rejected as unknown.
 */
export function splitPlateLetters(value: string): string[] {
  const compact = value.replace(/\s+/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < compact.length) {
    const two = compact.slice(i, i + 2);
    if (two === "هـ") {
      out.push(two);
      i += 2;
      continue;
    }
    if (compact[i] === "ه") {
      out.push("هـ");
      i += 1;
      continue;
    }
    out.push(compact[i]);
    i += 1;
  }
  return out;
}

/** Whether every character in an Arabic letters field is one of the 17
 * plate-legal letters - used by both the client's inline validation and
 * the server schema, so the two can never disagree on what is allowed. */
export function isValidPlateLettersAr(value: string): boolean {
  const glyphs = splitPlateLetters(value);
  return glyphs.length > 0 && glyphs.length <= 4 && glyphs.every((g) => LETTER_SET.has(g));
}

/**
 * Derives the Latin letters from a plate-legal Arabic string.
 *
 * Returns `null` for input that fails isValidPlateLettersAr rather than
 * producing a partial or best-guess result - callers on both sides
 * reject the write in that case instead of saving a mismatch.
 */
export function deriveLettersEn(lettersAr: string): string | null {
  if (!isValidPlateLettersAr(lettersAr)) return null;
  return (
    splitPlateLetters(lettersAr)
      .map((g) => PLATE_LETTER_MAP[g as PlateLetterAr])
      // Reversed on purpose. Arabic reads right to left, so the letter
      // written first is stamped at the *right* of the plate, while the
      // Latin line beneath is read left to right from that same position.
      // Both client references confirm the flip: "ن هـ ط" is stamped
      // "T H N", and "ح ن ط" is stamped "T N J".
      .reverse()
      .join("")
  );
}
