"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useCarousel } from "@/hooks/useCarousel";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { plateClassificationLabel, plateTypeLabel, usageTypeLabel } from "@/lib/constants";
import type { PlateDTO } from "@/types/dto";

/**
 * "أحدث اللوحات" — the normal (non-VIP) marketplace section, directly
 * below the VIP panel (§ Home VIP/Normal ordering — VIP always first).
 * `getLatestPlates` already excludes `isVip` plates, so a plate can never
 * appear here and in the VIP section at once.
 *
 * Same carousel shell as FeaturedAds (useCarousel + mz-scroller/mz-snap,
 * matching breakpoints) rather than a static grid, so both sections
 * behave identically at every screen size — duplicated locally rather
 * than extracted, since FeaturedAds' version isn't exported and this is
 * the only other caller today.
 *
 * The ordering is the backend's (`createdAt` descending); this component
 * never re-sorts what it is handed.
 */
export function LatestPlates({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();
  const isArabic = locale === "ar";

  const { ref: scroller, pages, page, step, scrollToPage, canPrev, canNext } = useCarousel<HTMLDivElement>(
    isArabic,
    [plates.length, locale]
  );

  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <section className="relative" aria-labelledby="latest-plates-title">
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

      <div
        ref={scroller}
        className="mz-scroller flex gap-4 overflow-x-auto pb-1"
        role="list"
        aria-label={t("home.latestTitle")}
      >
        {plates.map((plate) => (
          <Link
            key={plate._id}
            href={`/listings/${plate._id}`}
            role="listitem"
            className={cn(
              "mz-snap mz-hover-lift flex shrink-0 flex-col rounded-(--radius-md) border border-(--color-border-light) bg-(--color-surface)/70 px-3.5 py-3",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
              // Widths derived from the track itself, same breakpoints as
              // the VIP carousel above it.
              "w-[78%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)]"
            )}
          >
            {/* One stage for every plate type. The inner box fixes the
                width at 88% of the card's content box — that is what
                makes a 5:1 private plate and a 2.2:1 square one read as
                the same "size" — and both branches only ever scale
                inside it, so no aspect ratio is touched. */}
            <div className="flex min-h-[4.75rem] items-center justify-center sm:min-h-[5.25rem]">
              {/* Drawn from this plate's own letters, numbers and logo —
                  never the seller's uploaded photo. */}
              <div className="flex w-[88%] items-center justify-center">
                <SaudiPlate
                  type={plate.type}
                  usageType={plate.usageType}
                  shape={plate.shape}
                  classification={plate.classification}
                  lettersAr={plate.lettersAr}
                  lettersEn={plate.lettersEn}
                  numbers={plate.numbers}
                  logo={plate.logo}
                  size="xl"
                  vip={plate.isVip}
                  locale={locale}
                />
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
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label={t("home.latestTitle")}>
          {Array.from({ length: pages }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === page}
              aria-label={`${index + 1}`}
              onClick={() => scrollToPage(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-(--duration-base)",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                index === page ? "w-7 bg-(--color-brand)" : "w-2 bg-(--color-border-strong) hover:bg-(--color-text-faint)"
              )}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("common.previous")}
            disabled={!canPrev}
            className="mz-carousel-arrow absolute top-[45%] start-0 z-20 hidden h-[42px] w-[42px] -translate-y-1/2 -ms-5 items-center justify-center rounded-full transition-colors duration-(--duration-fast) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:inline-flex"
          >
            <PrevIcon className="h-5 w-5" aria-hidden="true" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("common.next")}
            disabled={!canNext}
            className="mz-carousel-arrow absolute top-[45%] end-0 z-20 hidden h-[42px] w-[42px] -translate-y-1/2 -me-5 items-center justify-center rounded-full transition-colors duration-(--duration-fast) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:inline-flex"
          >
            <NextIcon className="h-5 w-5" aria-hidden="true" strokeWidth={2.2} />
          </button>
        </>
      )}
    </section>
  );
}
