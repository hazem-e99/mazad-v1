import { connectDB } from "@/lib/db";
import { BlockedWord } from "@/models/BlockedWord";
import { ChatMessage } from "@/models/ChatMessage";

/**
 * Chat moderation: normalize a word/message the same way on both sides of
 * the comparison, then match whole tokens — never raw substrings — against
 * the active blocked-word list.
 *
 * Design note on false positives (see the module's callers for the actual
 * gate): matching is done per *token* (a run of letters/digits split on
 * everything else), and a token must equal a normalized blocked word
 * exactly. This is the classic defense against the "Scunthorpe problem" —
 * a raw `message.includes(badWord)` check would block "الاسكندرية" for
 * containing a shorter unrelated bad word as a substring. Token-exact
 * matching cannot do that: a false hit would require the *entire* word the
 * user typed to normalize to something on the list.
 *
 * What normalization absorbs (deliberately conservative — see the
 * docstring on each step):
 *   - case (Latin)
 *   - Arabic diacritics (tashkeel) and the tatweel elongation character
 *   - common Arabic letter-variant spelling (أ/إ/آ -> ا, ة -> ه, ى/ئ -> ي, ؤ -> و)
 *   - "Arabizi" digit-for-letter substitution (3 -> ع, 7 -> ح, etc.)
 *   - runs of the same character 3+ long collapsed to 1 (catches
 *     "فuuuuck"/"كسسسم"-style stretching without touching ordinary
 *     double letters like "committee" or "الله", which this codebase's
 *     own words rely on reading correctly)
 *   - stray punctuation/symbols used as letter separators inside a token
 *     ("f.u.c.k", "ك_س_م")
 *
 * What it does NOT attempt (documented instead of half-implemented): a
 * message with every letter of a bad word individually spaced out as its
 * own token ("ك ل ب") is not reassembled and checked — doing that safely
 * would mean substring-matching across token boundaries, which reopens
 * exactly the false-positive class token-matching exists to close. This is
 * a known, accepted gap — see the report this module shipped with.
 */

// Arabic combining diacritics (the tashkeel block: fathatan U+064B through
// U+065F, plus the superscript alef U+0670) and the tatweel elongation
// character U+0640 — written as explicit code points, not literal glyphs,
// since combining marks don't render distinguishably in source and are
// easy to silently corrupt or mistype otherwise.
const ARABIC_DIACRITICS = /[ً-ٰٟ]/g;
const TATWEEL = /ـ/g;

const ARABIC_LETTER_VARIANTS: Record<string, string> = {
  "أ": "ا", // أ -> ا
  "إ": "ا", // إ -> ا
  "آ": "ا", // آ -> ا
  "ٱ": "ا", // ٱ -> ا
  "ة": "ه", // ة -> ه
  "ى": "ي", // ى -> ي
  "ئ": "ي", // ئ -> ي
  "ؤ": "و", // ؤ -> و
};

// "Arabizi" chat digits standing in for a letter with no direct Latin
// equivalent — only applied to tokens that contain at least one Arabic
// letter, so an ordinary number in an ordinary sentence ("عندي 2 لوحة")
// never gets reinterpreted.
const ARABIZI_DIGITS: Record<string, string> = {
  "2": "ء", // ء
  "3": "ع", // ع
  "5": "خ", // خ
  "6": "ط", // ط
  "7": "ح", // ح
  "8": "غ", // غ
};

// Light Latin leetspeak — only applied to tokens with no Arabic letters.
const LATIN_LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  "$": "s",
  "!": "i",
  "+": "t",
};

// Matches any character in the main Arabic Unicode block (U+0600-U+06FF).
const HAS_ARABIC_LETTER = /[؀-ۿ]/;
const HAS_LATIN_LETTER = /[a-z]/;

/** Collapses any run of the same character 3+ long down to one instance —
 * intentionally not 2+, since that would also eat ordinary doubled letters
 * ("committee", the shadda-doubled consonant spelled out in "الله") and
 * turn common legitimate words into unrelated ones for comparison. */
function collapseStretchedRuns(s: string): string {
  return s.replace(/(.)\1{2,}/gu, "$1");
}

/**
 * Normalizes one already-isolated token (letters/digits only, no
 * whitespace or punctuation — see `tokenize`) into the canonical form used
 * for comparison. Applied identically to blocked words at write time and
 * to message tokens at check time.
 */
export function normalizeToken(token: string): string {
  let s = token.toLowerCase();
  s = s.replace(ARABIC_DIACRITICS, "").replace(TATWEEL, "");
  s = Array.from(s)
    .map((ch) => ARABIC_LETTER_VARIANTS[ch] ?? ch)
    .join("");

  // Digit substitution only makes sense inside an actual word — a token
  // that's nothing but digits (a year, a price, a phone fragment) is left
  // untouched rather than reinterpreted as obfuscated letters.
  if (HAS_ARABIC_LETTER.test(s)) {
    s = Array.from(s)
      .map((ch) => ARABIZI_DIGITS[ch] ?? ch)
      .join("");
  } else if (HAS_LATIN_LETTER.test(s)) {
    s = Array.from(s)
      .map((ch) => LATIN_LEET[ch] ?? ch)
      .join("");
  }

  return collapseStretchedRuns(s);
}

/** Splits a raw message into letter/digit runs, discarding whitespace and
 * punctuation as separators. Unicode-aware (`\p{L}`/`\p{N}`) so Arabic
 * letters split the same way Latin ones do. */
export function tokenize(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// ---- Blocked-word lookup ----------------------------------------------------
//
// Deliberately no in-memory cache here, even though the chat handler runs
// inside the single long-lived process server/index.ts starts (see
// rate-limit.ts for a place that *does* rely on that). This module is
// reached from two different loading paths: server/index.ts's top-level
// `import` (evaluated before app.prepare() patches module loading — see
// that file's own comment on the identical issue with auctionService) and
// the Next-bundled API routes under src/app/api/. Those two paths can end
// up as two separate compiled copies of this module, each with its own
// module-scope variables — so a cache invalidated from the API-route copy
// would silently leave the socket handler's copy holding a stale word
// list for up to the cache's own TTL. That happened during development: a
// word blocked from the admin panel still let a matching message through
// several seconds later. A plain per-message query against an indexed,
// typically small collection is cheap enough that there's no real
// performance case for reintroducing a cache here.
async function getActiveNormalizedWords(): Promise<Set<string>> {
  await connectDB();
  const rows = await BlockedWord.find({ isActive: true }).select("normalized").lean<{ normalized: string }[]>();
  return new Set(rows.map((r) => r.normalized));
}

export interface ModerationResult {
  allowed: boolean;
  /** Present only when `allowed` is false. */
  matchedWords?: string[];
}

/**
 * The single check every chat message must pass before it is saved or
 * broadcast. Returns which normalized blocked word(s) a token matched
 * (for the moderation log), never which *user-facing* words they were —
 * callers must not echo `matchedWords` back to the sender.
 */
export async function checkMessage(text: string): Promise<ModerationResult> {
  const activeWords = await getActiveNormalizedWords();
  if (activeWords.size === 0) return { allowed: true };

  const matched = new Set<string>();
  for (const token of tokenize(text)) {
    const normalized = normalizeToken(token);
    if (normalized && activeWords.has(normalized)) matched.add(normalized);
  }

  if (matched.size === 0) return { allowed: true };
  return { allowed: false, matchedWords: Array.from(matched) };
}

export interface PurgedMessage {
  id: string;
  userId: string;
  text: string;
}

/**
 * Called right after a word becomes newly blocked (created active, or an
 * existing entry reactivated / retexted while active) — messages that
 * were sent *before* the word was blocked already made it into the chat
 * under the old rules, so blocking going forward isn't enough on its own
 * to satisfy "this word is not allowed here". Scoped to the one word that
 * just changed rather than re-running the full active list against every
 * message, since nothing else could have newly started matching.
 *
 * Callers are responsible for actually broadcasting each id's removal
 * (emitChatMessageDeleted) and for logging it — this only finds and
 * deletes.
 */
export async function purgeMessagesMatchingWord(normalizedWord: string): Promise<PurgedMessage[]> {
  await connectDB();
  const candidates = await ChatMessage.find({}).select("text user").lean<{ _id: unknown; text: string; user: unknown }[]>();

  const toPurge: PurgedMessage[] = [];
  for (const m of candidates) {
    const isMatch = tokenize(m.text).some((token) => normalizeToken(token) === normalizedWord);
    if (isMatch) toPurge.push({ id: String(m._id), userId: String(m.user), text: m.text });
  }

  if (toPurge.length > 0) {
    await ChatMessage.deleteMany({ _id: { $in: toPurge.map((m) => m.id) } });
  }
  return toPurge;
}
