"use client";

import { Crown, Search, Star } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { FeaturedAuctionCard } from "@/components/home/FeaturedAuctionCard";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { AuctionSummary } from "@/types/auction";
import type { PlateDTO } from "@/types/dto";

interface HeroProps {
  featured: AuctionSummary | null;
  vipPlates: PlateDTO[];
  liveCount: number;
}

export function Hero({ featured, vipPlates, liveCount }: HeroProps) {
  const { t, locale } = useTranslations();

  return (
    <section className="relative -mt-px overflow-hidden border-b border-(--color-border)">
      {/* The photograph and its scrims live in one component, so the section
          only owns layout. The backdrop carries its own top/bottom fades. */}
      <HeroBackdrop className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="mz-container relative grid min-h-[32rem] grid-cols-1 items-center gap-10 py-14 lg:min-h-[36rem] lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        {/* ── Copy ─────────────────────────────────────────────────────
            First in the DOM, so mobile stacks heading → description → CTA
            → featured card without any order juggling (§49). */}
        <div className="flex flex-col items-start gap-6">
          <h1 className="max-w-xl text-4xl font-bold leading-[1.15] tracking-tight text-(--color-text) sm:text-5xl lg:text-[3.5rem]">
            {t("home.titleLine1")}{" "}
            <span className="text-(--color-gold)">{t("home.titleHighlight")}</span>{" "}
            {t("home.titleLine2")}
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
            {t("home.subtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/auctions" variant="gold" size="lg">
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
              {t("home.browseAuctions")}
            </LinkButton>
            <LinkButton href="/vip" variant="secondary" size="lg">
              <Crown className="h-4.5 w-4.5" aria-hidden="true" />
              {t("home.vipPlates")}
            </LinkButton>
          </div>

          {(vipPlates.length > 0 || liveCount > 0) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm">
              {vipPlates.length > 0 && (
                <span className="flex items-center gap-2 text-(--color-text-muted)">
                  <Star className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                  <span className="tnum">{t("home.vipCountLabel", { count: vipPlates.length })}</span>
                </span>
              )}
              {liveCount > 0 && (
                <span className="flex items-center gap-2 text-(--color-text-muted)">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-live) opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-live)" />
                  </span>
                  <span className="tnum">{t("home.liveCountLabel", { count: liveCount })}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Featured auction ─────────────────────────────────────── */}
        <div className="w-full">
          {featured ? (
            <FeaturedAuctionCard auction={featured} />
          ) : vipPlates.length > 0 ? (
            <FannedPlates plates={vipPlates.slice(0, 3)} locale={locale} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Fallback composition when nothing is live or scheduled: three VIP
 * plates fanned like a hand of cards, so the hero still has a subject
 * rather than an apologetic empty box. */
function FannedPlates({ plates, locale }: { plates: PlateDTO[]; locale: "ar" | "en" }) {
  return (
    <div className="relative flex min-h-64 items-center justify-center">
      <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-0" />
      {plates.map((plate, i) => (
        <div
          key={plate._id}
          className="absolute transition-transform duration-(--duration-slow) ease-(--ease-out-expo)"
          style={{
            transform: `translateX(${(i - 1) * 26}px) translateY(${i === 1 ? -14 : 10}px) rotate(${(i - 1) * 5}deg)`,
            zIndex: i === 1 ? 3 : 1,
          }}
        >
          <SaudiPlate
            type={plate.type}
            lettersAr={plate.lettersAr}
            lettersEn={plate.lettersEn}
            numbers={plate.numbers}
            logo={plate.logo}
            size={i === 1 ? "lg" : "md"}
            vip
            locale={locale}
          />
        </div>
      ))}
    </div>
  );
}
