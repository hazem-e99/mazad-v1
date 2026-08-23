"use client";

import Link from "next/link";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatNumber } from "@/lib/format";
import { plateClassificationLabel, plateTypeLabel, usageTypeLabel } from "@/lib/constants";
import type { PlateDTO } from "@/types/dto";

/**
 * "أحدث اللوحات" — the newest approved listings, in submission order.
 *
 * The ordering is the backend's (`createdAt` descending, see
 * getLatestPlates); this component never re-sorts what it is handed, so
 * the heading stays true and, under RTL, the newest plate lands in the
 * right-hand cell on its own — no array reversal is involved.
 *
 * The card is deliberately reduced to plate → tags → price. The plate is
 * the thing being sold and everything else competes with it, so the
 * listing title is left to the detail page the card links to.
 */
export function LatestPlates({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();

  return (
    <section aria-labelledby="latest-plates-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        {/* The rule reads as a bracket on the heading block, so it is a
            sibling of the text rather than a border on it — that keeps it
            the same height whether or not the subtitle wraps. */}
        <div className="flex items-stretch gap-3">
          <span className="w-[3px] shrink-0 rounded-(--radius-pill) bg-(--color-brand)" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="latest-plates-title"
                className="text-xl font-bold tracking-tight text-(--color-text) sm:text-2xl"
              >
                {t("home.latestTitle")}
              </h2>
              <span className="rounded-(--radius-pill) bg-(--color-primary-soft) px-3 py-1 text-[11px] font-bold leading-none text-(--color-brand)">
                {t("home.latestBadge")}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-(--color-text-muted)">{t("home.latestSubtitle")}</p>
          </div>
        </div>

        <Link
          href="/listings"
          className="inline-flex h-[38px] shrink-0 items-center rounded-(--radius-pill) bg-(--color-brand) px-6 text-sm font-semibold text-(--color-brand-foreground) shadow-[0_4px_12px_rgba(8,116,69,0.18)] transition-colors hover:bg-(--color-brand-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
        >
          {t("home.latestCta")}
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {plates.map((plate) => (
          <li key={plate._id}>
            <Link
              href={`/listings/${plate._id}`}
              className="mz-hover-lift flex h-full flex-col rounded-(--radius-md) border border-(--color-border-light) bg-(--color-surface)/70 px-3.5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            >
              {/* One stage for every plate type. The inner box fixes the
                  width at 88% of the card's content box — that is what
                  makes a 5:1 private plate and a 2.2:1 square one read as
                  the same "size" — and both branches only ever scale
                  inside it, so no aspect ratio is touched. `min-h` rather
                  than `h` so an unusually tall type grows instead of being
                  clipped; the grid stretches the row to match. */}
              <div className="flex min-h-[4.75rem] items-center justify-center sm:min-h-[5.25rem]">
                {/* Drawn from this plate's own letters, numbers and logo —
                    never the seller's uploaded photo. `xl` is `w-full`
                    here, so the wrapper above decides the width; its own
                    max-width never binds at card scale, and `cn` is plain
                    clsx, so passing a competing width class would be a
                    coin flip. */}
                <div className="flex w-[88%] items-center justify-center">
                  {plate.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={plate.image}
                      alt={plateDisplayName(plate, locale)}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="max-h-[5.25rem] w-full object-contain"
                    />
                  ) : (
                    // `xl` is `w-full` here — the wrapper above is what
                    // decides the width. Its own max-width never binds at
                    // card scale, and `cn` is plain clsx, so passing a
                    // competing width class would be a coin flip.
                    <SaudiPlate
                      type={plate.type}
                      lettersAr={plate.lettersAr}
                      lettersEn={plate.lettersEn}
                      numbers={plate.numbers}
                      logo={plate.logo}
                      size="xl"
                      vip={plate.isVip}
                      locale={locale}
                    />
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                <span className="rounded-(--radius-pill) bg-(--color-surface-secondary) px-2.5 py-[3px] text-[12px] leading-none text-(--color-text-secondary)">
                  {plate.usageType ? usageTypeLabel(plate.usageType, locale) : plateTypeLabel(plate.type, locale)}
                </span>
                {plate.classification && (
                  <span className="rounded-(--radius-pill) bg-(--color-surface-secondary) px-2.5 py-[3px] text-[12px] leading-none text-(--color-text-secondary)">
                    {plateClassificationLabel(plate.classification, locale)}
                  </span>
                )}
              </div>

              {/* Split rather than formatSar so the currency word can sit
                  smaller than the figure, as the design has it — the two
                  stay in one element so it is still announced as one
                  price. */}
              <p className="tnum mt-2 text-center text-[18px] font-bold leading-none text-(--color-brand)">
                {plate.price != null ? (
                  <>
                    {formatNumber(plate.price, locale)}{" "}
                    <span className="text-[0.72em] font-semibold">{t("common.riyal")}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
