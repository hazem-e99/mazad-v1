"use client";

import Link from "next/link";
import { Crown, ArrowLeft, ArrowRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateDTO } from "@/types/dto";

/**
 * The slim premium band above the navbar. The plate track is rendered
 * twice and translated by exactly -50%, which is what makes the drift
 * seamless; the duplicate is `aria-hidden` so assistive tech reads the
 * list once. Motion pauses on hover and on keyboard focus, and is dropped
 * entirely under `prefers-reduced-motion` (see globals.css).
 */
export function VipTicker({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();

  if (plates.length === 0) return null;

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  // Pace the loop by content length so a short list does not sprint.
  const duration = Math.max(30, plates.length * 7);

  return (
    <div className="relative border-b border-(--color-vip-border)/60 bg-[linear-gradient(90deg,#14110a,#0d131d_45%,#14110a)]">
      <div className="mz-container flex h-11 items-center gap-4">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-(--color-gold)">
          <Crown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
          <span className="hidden sm:inline">{t("pages.vipStripLabel")}</span>
        </span>

        <span className="h-4 w-px shrink-0 bg-(--color-vip-border)" aria-hidden="true" />

        <div className="mz-marquee-viewport relative min-w-0 flex-1 overflow-hidden">
          {/* Fade the band into the page at both ends so plates enter and
              leave rather than being clipped mid-glyph. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-linear-to-r from-(--color-bg) to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 z-10 w-10 bg-linear-to-l from-(--color-bg) to-transparent"
          />

          <div
            className="mz-marquee flex w-max items-center gap-3 py-1.5"
            style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-3" aria-hidden={copy === 1 || undefined}>
                {plates.map((plate) => (
                  <Link
                    key={`${copy}-${plate._id}`}
                    href="/vip"
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="rounded-md transition-transform duration-(--duration-fast) hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                    aria-label={t("pages.vipPlateAriaLabel", { letters: plate.lettersAr, numbers: plate.numbers })}
                  >
                    <SaudiPlate
                      type={plate.type}
                      usageType={plate.usageType}
                      shape={plate.shape}
                      classification={plate.classification}
                      lettersAr={plate.lettersAr}
                      lettersEn={plate.lettersEn}
                      numbers={plate.numbers}
                      logo={plate.logo}
                      size="xs"
                      locale={locale}
                    />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/vip"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-(--color-gold) transition-colors hover:text-(--color-gold-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          {t("home.viewAll")}
          <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
