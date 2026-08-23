"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatSar } from "@/lib/format";
import { plateClassificationLabel, plateTypeLabel, usageTypeLabel } from "@/lib/constants";
import { plateDisplayName } from "@/lib/plateLabel";
import type { PlateDTO } from "@/types/dto";

/**
 * "أحدث اللوحات" — the newest approved listings, in submission order.
 *
 * The ordering is the backend's (`createdAt` descending, see
 * getLatestPlates); this component never re-sorts what it is handed, so
 * the heading stays true. A plate published a minute ago appears here on
 * the next request without anything being touched in the frontend.
 */
export function LatestPlates({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section aria-labelledby="latest-plates-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="latest-plates-title" className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
              {t("home.latestTitle")}
            </h2>
            <span className="rounded-(--radius-pill) bg-(--color-primary-soft) px-2.5 py-1 text-[11px] font-bold text-(--color-brand)">
              {t("home.latestBadge")}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-(--color-text-muted)">{t("home.latestSubtitle")}</p>
        </div>
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-pill) bg-(--color-brand) px-5 text-sm font-semibold text-(--color-brand-foreground) transition-colors hover:bg-(--color-brand-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
        >
          {t("home.latestCta")}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plates.map((plate) => (
          <li key={plate._id}>
            <Link
              href={`/listings/${plate._id}`}
              className="mz-hover-lift flex h-full flex-col gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            >
              <div className="flex min-h-[4.25rem] items-center justify-center">
                {plate.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plate.image}
                    alt={plateDisplayName(plate, locale)}
                    className="max-h-[4.5rem] w-full object-contain"
                  />
                ) : (
                  <SaudiPlate
                    type={plate.type}
                    lettersAr={plate.lettersAr}
                    lettersEn={plate.lettersEn}
                    numbers={plate.numbers}
                    logo={plate.logo}
                    size="sm"
                    vip={plate.isVip}
                    locale={locale}
                    className="w-full"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-(--color-text-muted)">
                <span className="rounded-(--radius-sm) bg-(--color-surface-secondary) px-2 py-1">
                  {plate.usageType ? usageTypeLabel(plate.usageType, locale) : plateTypeLabel(plate.type, locale)}
                </span>
                {plate.classification && (
                  <span className="rounded-(--radius-sm) bg-(--color-surface-secondary) px-2 py-1">
                    {plateClassificationLabel(plate.classification, locale)}
                  </span>
                )}
              </div>

              <p className="tnum mt-auto text-base font-bold text-(--color-brand)">
                {plate.price != null ? formatSar(plate.price, locale) : "—"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
