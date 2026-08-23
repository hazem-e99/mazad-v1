import type { PlateClassification, PlateShape, PlateType, UsageType } from "@/lib/constants";

/**
 * Everything the plate renderers need to know, resolved from a record's
 * own fields in one place.
 *
 * The renderers are dumb by design: they take a spec and draw it. Which
 * layout, which accent, how big the characters — all of it is decided
 * here, so a plate looks identical on the home carousel, in the market
 * grid, on the detail page and on the admin's moderation screen, and so
 * the rules can be read (and corrected) without opening any JSX.
 */

/** Which physical stock the plate is cut from. `wide` is the long strip
 * every car carries; `square` is the short two-row format used by bikes
 * and by the small square/sport stock. */
export type PlateLayout = "wide" | "square";

/** The category glyphs stamped under the KSA letters. Drawn rather than
 * typed — see PlateKsaStrip — because a text glyph renders at a different
 * weight and baseline in every font that happens to be installed. */
export type PlateMarker =
  | "circle"
  | "triangle-up"
  | "triangle-down"
  | "triangle-left"
  | "diamond"
  | "bars"
  | null;

export interface PlateAccent {
  /** Fill behind the KSA strip — the only part of an official plate that
   * carries the category colour. */
  strip: string;
  /** Ink on that fill, chosen for contrast against it. */
  stripInk: string;
  /** The small category glyph stamped under the KSA letters. */
  marker: PlateMarker;
}

export interface PlateSpec {
  layout: PlateLayout;
  /** CSS aspect-ratio value for the plate face. */
  aspect: string;
  accent: PlateAccent;
  /** Multipliers on the base character sizes, so a four-digit group fits
   * the same cell a single digit sits in without either overflowing or
   * looking lost. */
  scale: { numbers: number; letters: number };
}

/**
 * Usage → colour and symbol. The single source for both.
 *
 * A Saudi plate carries its category on the KSA strip, never across the
 * face — a taxi plate is a white plate with a yellow strip, not a yellow
 * plate — so the fill and its ink live here and travel to whichever
 * layout is drawing. Nothing else in the product decides a plate colour,
 * and there is deliberately no user-facing colour field: the category is
 * a consequence of what the plate is licensed for.
 *
 * Colours and symbols are read off the client's reference sheet:
 * white/disc for private, yellow/▲ for public transport and taxis,
 * blue/▼ for the commercial classes, green for diplomatic and silver
 * with a left-pointing marker for temporary registrations.
 *
 * Two are judgement calls, flagged rather than invented quietly:
 * `diplomatic` gets a diamond (the sheet shows the green fill but no
 * legible marker at that resolution), and `sport` keeps the white face
 * because no official sport colour appears anywhere in the references —
 * it is given its own marker so it is still distinguishable from private.
 */
const USAGE_ACCENTS: Record<UsageType, PlateAccent> = {
  private: { strip: "#f2f2f0", stripInk: "#111111", marker: "circle" },
  transport: { strip: "#f0b429", stripInk: "#111111", marker: "triangle-up" },
  // `نقل خاص` and `نقل تجاري` are separate registrations that share the
  // commercial blue on the road. They stay separate values in the data —
  // only the visual is shared.
  private_transport: { strip: "#2f7cc0", stripInk: "#ffffff", marker: "triangle-down" },
  commercial: { strip: "#2f7cc0", stripInk: "#ffffff", marker: "triangle-down" },
  sport: { strip: "#f2f2f0", stripInk: "#111111", marker: "bars" },
  diplomatic: { strip: "#1f8a4c", stripInk: "#ffffff", marker: "diamond" },
  temporary: { strip: "#c9c9c4", stripInk: "#111111", marker: "triangle-left" },
};

const DEFAULT_ACCENT: PlateAccent = USAGE_ACCENTS.private;

/**
 * The public entry point for anything that needs a plate's category
 * styling without drawing a whole plate — a legend, a filter chip, an
 * admin table cell. Falls back to the private styling for an unknown or
 * absent value so a caller never has to guard.
 */
export function getPlateUsageStyle(usageType: UsageType | null | undefined): PlateAccent {
  return (usageType && USAGE_ACCENTS[usageType]) || DEFAULT_ACCENT;
}

/**
 * Legacy bridge.
 *
 * `shape` and `usageType` were split out of the older single `type` enum,
 * and plates created before that migration carry only `type`. Rather than
 * rewriting those rows, the old value is read as the fallback for both —
 * so a record from either era draws correctly.
 */
const TYPE_TO_SHAPE: Record<PlateType, PlateShape> = {
  transfer: "wide",
  individual: "wide",
  private: "wide",
  sport: "wide",
  wide: "wide",
  small_square: "small_square",
  small_sport: "small_sport",
};

const TYPE_TO_USAGE: Record<PlateType, UsageType> = {
  transfer: "transport",
  individual: "private",
  private: "private",
  sport: "sport",
  wide: "private",
  small_square: "private",
  small_sport: "sport",
};

/** The short two-row stock; everything else is the long strip. */
const SQUARE_SHAPES: PlateShape[] = ["small_square", "small_sport"];

/**
 * Character sizing.
 *
 * A cell holding "1" and a cell holding "7003" are the same width, so the
 * type has to give way as the group grows or the four-digit case runs into
 * its dividers. Measured against the reference sheet rather than derived:
 * the drop is gentle up to three characters and steeper at four, which is
 * where real stock visibly tightens.
 */
function scaleForLength(length: number): number {
  if (length <= 1) return 1;
  if (length === 2) return 0.95;
  if (length === 3) return 0.9;
  if (length === 4) return 0.83;
  return 0.74;
}

/** How many characters a group actually occupies, ignoring the spacing the
 * data may or may not carry. */
function glyphCount(value: string): number {
  return value.replace(/\s+/g, "").length;
}

/**
 * `classification` names the number group's length (فردي/ثنائي/ثلاثي/رباعي)
 * but the digits themselves are authoritative — a record can disagree with
 * its own label, and what has to fit is what will be drawn. The label is
 * used only when the digits are missing.
 */
const CLASSIFICATION_LENGTHS: Record<PlateClassification, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quadruple: 4,
};

export interface PlateSpecInput {
  type: PlateType;
  numbers: string;
  lettersAr: string;
  lettersEn: string;
  usageType?: UsageType | null;
  shape?: PlateShape | null;
  classification?: PlateClassification | null;
}

export function resolvePlateSpec(input: PlateSpecInput): PlateSpec {
  const shape = input.shape ?? TYPE_TO_SHAPE[input.type] ?? "wide";
  const usageType = input.usageType ?? TYPE_TO_USAGE[input.type] ?? "private";

  const layout: PlateLayout = SQUARE_SHAPES.includes(shape) ? "square" : "wide";

  const digitCount =
    glyphCount(input.numbers) || (input.classification ? CLASSIFICATION_LENGTHS[input.classification] : 3);
  // Latin and Arabic letter groups are the same length on a real plate;
  // whichever the record actually carries decides the fit.
  const letterCount = Math.max(glyphCount(input.lettersAr), glyphCount(input.lettersEn), 1);

  return {
    layout,
    // The long strip is close to 5:1; the short stock is roughly 1.7:1 and
    // stacks its content over two rows instead of spreading it over four
    // columns. `small_sport` sits a touch wider than `small_square`.
    aspect: layout === "square" ? (shape === "small_sport" ? "1.9 / 1" : "1.7 / 1") : "4.6 / 1",
    accent: getPlateUsageStyle(usageType),
    scale: { numbers: scaleForLength(digitCount), letters: scaleForLength(letterCount) },
  };
}

