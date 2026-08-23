"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * The call to action between the categories and the newest listings.
 *
 * The panel is one photograph — plates stacked against a Saudi flag on a
 * dark brown ground — rather than a flat charcoal fill with plate
 * components arranged on top of it. The artwork already carries the
 * plates, so nothing is drawn over it except the copy and the two
 * controls.
 *
 * Both controls point at /plates/new: the existing submission flow, with
 * its own validation, ownership-document upload and moderation queue.
 * Nothing about that flow is duplicated or re-implemented here.
 */
export function SellPlateBanner() {
  const { t, locale } = useTranslations();
  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  // The photograph's subject sits on its left and its empty ground on the
  // right, so the scrim has to darken whichever edge the copy lands on —
  // the reading side. Physical directions, resolved once from the locale,
  // because a gradient angle has no logical form.
  const scrim = isArabic
    ? "linear-gradient(270deg, rgba(24,20,16,0.94) 0%, rgba(24,20,16,0.78) 34%, rgba(24,20,16,0.34) 62%, rgba(24,20,16,0.12) 100%)"
    : "linear-gradient(90deg, rgba(24,20,16,0.94) 0%, rgba(24,20,16,0.78) 34%, rgba(24,20,16,0.34) 62%, rgba(24,20,16,0.12) 100%)";

  return (
    <section
      className="relative isolate min-h-[13rem] overflow-hidden rounded-(--radius-xl) border border-(--color-gold)/25 shadow-(--shadow-soft) sm:min-h-[12.5rem]"
      aria-labelledby="sell-cta-title"
    >
      <Image
        src="/images/bg-banner.webp"
        alt=""
        fill
        sizes="(min-width: 1280px) 1200px, 100vw"
        loading="eager"
        fetchPriority="high"
        unoptimized
        // The plates live in the left third of a very wide frame. Holding
        // that edge in view keeps them on screen as the banner narrows,
        // instead of cropping to the empty ground in the middle.
        className="-z-10 object-cover object-[25%_center] sm:object-[35%_center] lg:object-center"
      />
      <span className="absolute inset-0 -z-10" style={{ background: scrim }} aria-hidden="true" />

      <div className="flex h-full min-h-[13rem] flex-col items-start justify-center gap-6 p-6 sm:min-h-[12.5rem] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="flex items-center gap-4">
          <Link
            href="/plates/new"
            aria-label={t("home.sellCta")}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--color-gold)/45 text-(--color-gold) transition-colors duration-(--duration-fast) hover:bg-(--color-gold)/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:inline-flex"
          >
            <Arrow className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          </Link>

          <div className="text-start">
            <h2
              id="sell-cta-title"
              className="text-[1.4rem] font-bold leading-tight text-(--color-on-charcoal) sm:text-[1.65rem]"
            >
              {t("home.sellTitle")}
            </h2>
            <p className="mt-1.5 text-[13px] font-medium text-(--color-gold) sm:text-[15px]">
              {t("home.sellSubtitle")}
            </p>
          </div>
        </div>

        <Link
          href="/plates/new"
          className="mz-gold-surface inline-flex h-12 shrink-0 items-center gap-2 rounded-(--radius-pill) px-6 text-sm font-bold transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.6} />
          {t("home.sellCta")}
        </Link>
      </div>
    </section>
  );
}
