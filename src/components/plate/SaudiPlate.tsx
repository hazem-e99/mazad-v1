import { cn } from "@/lib/cn";
import type { PlateClassification, PlateShape, PlateType, UsageType } from "@/lib/constants";
import { WidePlate } from "@/components/plate/WidePlate";
import { SquarePlate } from "@/components/plate/SquarePlate";
import { resolvePlateSpec } from "@/components/plate/plateSpec";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

export type PlateSize = "xs" | "sm" | "md" | "lg" | "xl" | "spotlight";

interface SaudiPlateProps {
  /** Legacy single enum. Still the only field some records carry, so it
   * stays required and acts as the fallback for `shape` and `usageType`. */
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;

  /** ---- The split taxonomy. All optional: a record predating the
   * migration has none of them, and resolvePlateSpec derives sensible
   * values from `type` in that case. */
  usageType?: UsageType | null;
  shape?: PlateShape | null;
  classification?: PlateClassification | null;

  /** xs = navbar chip · sm = tables/search · md = auction cards ·
   *  lg = auction details · xl = featured/hero · spotlight = home stage. */
  size?: PlateSize;
  className?: string;
  /** Presentation ring for VIP listings. Deliberately outside the plate
   * face: VIP is a marketing status, not part of the official artwork. */
  vip?: boolean;
  /** Selected state for pickers (admin auction builder, add-plate flow). */
  selected?: boolean;
  /** Sport plates are English-only (§ Sports Plate rule): defaults to
   * `type === "sport"` so every existing call site gets this for free, but
   * can be overridden explicitly by a caller that already knows the plate's
   * intended layout. */
  englishOnly?: boolean;
  /** Defaults to "ar" for callers without locale context — this component
   * has no "use client" directive so it can render from server
   * components. Pass the active locale for a correct accessible name. */
  locale?: Locale;
}

/* One width drives the whole composition: every internal dimension is a
   share of the plate's own width (`cqi`), so the same markup is correct at
   every one of these sizes with no size-specific rules. */
const sizeWidth: Record<PlateSize, string> = {
  xs: "w-24",
  sm: "w-40",
  md: "w-56",
  lg: "w-72",
  xl: "w-full max-w-[28rem]",
  spotlight: "w-full max-w-[42rem]",
};

const PLATE_WORD: Record<Locale, string> = { ar: "لوحة", en: "Plate" };
const NO_LOGO_WORD: Record<Locale, string> = { ar: "بلا شعار", en: "No Logo" };

/**
 * The plate, drawn from the record's own data.
 *
 * This is the single renderer every surface in the product uses — market
 * cards, the home carousel, auction pages, the add-plate preview and the
 * admin's moderation screens all call it, so a plate cannot look like one
 * thing to a seller and another to the moderator reviewing it.
 *
 * It draws the *data*, never a photograph. Two earlier revisions got that
 * wrong in the same way: one picked a `/images/License*.png` by hashing
 * the letters, the other preferred the seller's uploaded photo when there
 * was one. Both put characters belonging to a different plate on the card.
 * The uploaded photo is submission evidence and belongs on the moderation
 * screens, not in place of the plate's artwork.
 *
 * Which layout, which accent and how large the characters are all come
 * from resolvePlateSpec — see plateSpec.ts for the rules, and for how a
 * pre-migration record is handled.
 *
 * The face is fixed black-on-white in both themes: it depicts an official
 * document, so it does not follow the site's light/dark tokens. The card
 * around it is what changes.
 */
export function SaudiPlate({
  type,
  lettersAr,
  lettersEn,
  numbers,
  logo,
  usageType,
  shape,
  classification,
  size = "md",
  className,
  vip = false,
  selected = false,
  locale = "ar",
  englishOnly,
}: SaudiPlateProps) {
  const spec = resolvePlateSpec({ type, numbers, lettersAr, lettersEn, usageType, shape, classification });
  // `usageType` is the true "is this a sport plate" signal — `type` is a
  // legacy bridge value that can land on "small_sport" instead of "sport"
  // once a shape is picked, and would otherwise miss that case.
  const isEnglishOnly = englishOnly ?? (usageType === "sport" || type === "sport");

  const logoName = logo ? (locale === "en" ? logo.nameEn : logo.nameAr) : NO_LOGO_WORD[locale];
  const label = `${PLATE_WORD[locale]} ${isEnglishOnly ? lettersEn : lettersAr} ${numbers} — ${logoName}`;

  const Layout = spec.layout === "square" ? SquarePlate : WidePlate;

  return (
    <div className={cn("@container shrink-0", sizeWidth[size], className)}>
      <div
        // Pinned LTR: the cell order is the reference stock's and must not
        // mirror under the site's RTL. Each line inside sets its own
        // direction (see WidePlate / SquarePlate).
        dir="ltr"
        role="img"
        aria-label={label}
        className={cn(
          "saudi-plate relative w-full select-none overflow-hidden bg-[#f7f7f5] shadow-(--shadow-plate)",
          // A real plate has a heavy stamped edge and only a slight round
          // — nothing like the card radii used elsewhere in the product.
          "rounded-[1.4cqi] border-[0.55cqi] border-black",
          "transition-transform duration-(--duration-base) ease-(--ease-out-expo)",
          vip && "ring-[0.05em] ring-(--color-gold)/70",
          selected && "ring-[0.08em] ring-(--color-gold)"
        )}
      >
        <Layout
          spec={spec}
          lettersAr={lettersAr}
          lettersEn={lettersEn}
          numbers={numbers}
          logo={logo}
          locale={locale}
          englishOnly={isEnglishOnly}
        />
      </div>
    </div>
  );
}
