"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateDTO } from "@/types/dto";

/**
 * The charcoal call to action between the categories and the newest
 * listings.
 *
 * Both controls point at /plates/new — the existing submission flow, with
 * its own validation, ownership-document upload and moderation queue.
 * Nothing about that flow is duplicated or re-implemented here.
 *
 * The plates on the left are real records (the newest listings the page
 * already fetched), shown as a fan rather than as stock artwork.
 */
export function SellPlateBanner({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const fan = plates.slice(0, 3);

  return (
    <section className="mz-panel-charcoal overflow-hidden rounded-(--radius-xl)" aria-labelledby="sell-cta-title">
      <div className="flex flex-col items-center gap-6 p-6 sm:p-8 lg:flex-row lg:justify-between lg:gap-10 lg:p-10">
        <div className="flex items-center gap-4 lg:order-2">
          <Link
            href="/plates/new"
            aria-label={t("home.sellCta")}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--color-gold)/40 text-(--color-gold) transition-colors hover:bg-(--color-gold)/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          >
            <Arrow className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          </Link>

          <div className="text-start">
            <h2 id="sell-cta-title" className="text-xl font-bold text-(--color-on-charcoal) sm:text-2xl">
              {t("home.sellTitle")}
            </h2>
            <p className="mt-1.5 text-sm text-(--color-on-charcoal-muted)">{t("home.sellSubtitle")}</p>
          </div>
        </div>

        {fan.length > 0 && (
          <div className="hidden shrink-0 items-center lg:order-1 lg:flex" aria-hidden="true">
            {fan.map((plate, index) => (
              <div
                key={plate._id}
                className="w-32 shrink-0"
                style={{
                  marginInlineStart: index === 0 ? 0 : "-2.75rem",
                  transform: `rotate(${(index - 1) * 4}deg)`,
                  zIndex: index,
                }}
              >
                <SaudiPlate
                  type={plate.type}
                  lettersAr={plate.lettersAr}
                  lettersEn={plate.lettersEn}
                  numbers={plate.numbers}
                  logo={plate.logo}
                  size="xs"
                  locale={locale}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        <Link
          href="/plates/new"
          className="mz-gold-surface inline-flex h-12 shrink-0 items-center gap-2 rounded-(--radius-pill) px-6 text-sm font-bold transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) lg:order-3"
        >
          <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.6} />
          {t("home.sellCta")}
        </Link>
      </div>
    </section>
  );
}
