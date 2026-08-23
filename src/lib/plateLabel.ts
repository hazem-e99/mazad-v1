import type { Locale } from "@/lib/i18n";

/**
 * What to call a plate on a card.
 *
 * `title` is an optional listing field — most records carry none — so the
 * fallback has to be the plate's own identity, which every record always
 * has. Falling back to the *section heading* instead (as the home page
 * did: `plate.title ?? t("home.vipPlates")`) rendered four different VIP
 * plates as four copies of the words "لوحات VIP", hiding the only data
 * that told them apart.
 */
export function plateDisplayName(
  plate: { title?: string | null; lettersAr: string; lettersEn: string; numbers: string },
  locale: Locale
): string {
  if (plate.title) return plate.title;
  const letters = locale === "en" ? plate.lettersEn : plate.lettersAr;
  return `${letters} ${plate.numbers}`.trim();
}
