"use client";

import Link from "next/link";
import { useState } from "react";
import { Gavel, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { IconButton } from "@/components/ui/Button";
import { VipBadge } from "@/components/ui/VipBadge";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

/**
 * The live rail: countdown, plate and price given equal billing across
 * one wide surface, stepped through one auction at a time.
 *
 * Paging is index-based over data already on the page — no fetch, no
 * scroll container — because each slide is a full-width composition where
 * a partially-visible neighbour would read as a rendering fault rather
 * than as an affordance.
 */
export function LiveAuctionSpotlight({ auctions }: { auctions: AuctionSummary[] }) {
  const { t, locale } = useTranslations();
  const [index, setIndex] = useState(0);

  if (auctions.length === 0) return null;

  const auction = auctions[Math.min(index, auctions.length - 1)];
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  const step = (delta: number) => setIndex((i) => (i + delta + auctions.length) % auctions.length);

  return (
    <div className="mz-edge-gold relative overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated)">
      <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-x-0 -top-24 h-56 opacity-60" />

      <div className="relative grid grid-cols-1 items-center gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
        {/* Countdown */}
        <div className="order-2 flex flex-col items-center gap-2.5 lg:order-1 lg:items-start">
          <span className="text-xs font-medium text-(--color-text-muted)">{t("auction.endsIn")}</span>
          <CountdownTimer endAt={auction.endAt} variant="blocks" size="md" urgency />
        </div>

        {/* Plate */}
        <div className="order-1 flex flex-col items-center gap-3 lg:order-2">
          {auction.plate.isVip && <VipBadge />}
          <Link
            href={`/auctions/${auction._id}`}
            className="group rounded-(--radius-lg) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
          >
            <SaudiPlate
              type={auction.plate.type}
              lettersAr={auction.plate.lettersAr}
              lettersEn={auction.plate.lettersEn}
              numbers={auction.plate.numbers}
              logo={auction.plate.logo}
              size="lg"
              vip={auction.plate.isVip}
              locale={locale}
              className="transition-transform duration-(--duration-base) ease-(--ease-out-expo) group-hover:scale-[1.015]"
            />
          </Link>
        </div>

        {/* Price + meta + CTA */}
        <div className="order-3 flex flex-col items-center gap-4 lg:items-end">
          <PriceDisplay
            amount={auction.currentPrice}
            label={t("auction.currentPrice")}
            size="lg"
            className="items-center lg:items-end"
          />

          <dl className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs lg:justify-end">
            {auction.highestBidder && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("auction.highestBidder")}</dt>
                <UserRound className="h-3.5 w-3.5 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.75} />
                <dd className="font-medium text-(--color-text-muted)">{auction.highestBidder.name}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t("auction.bidsLabel")}</dt>
              <Gavel className="h-3.5 w-3.5 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.75} />
              <dd className="tnum text-(--color-text-muted)">{t("auction.bidsCount", { count: auction.bidCount })}</dd>
            </div>
          </dl>

          <Link
            href={`/auctions/${auction._id}`}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-(--radius-md) px-7 text-sm font-semibold",
              "bg-linear-to-b from-(--color-gold-hover) to-(--color-gold) text-(--color-gold-foreground)",
              "shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_18px_-8px_rgba(236,189,51,.55)]",
              "transition-[filter,transform] duration-(--duration-fast) hover:brightness-110 active:translate-y-px",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            )}
          >
            <Gavel className="h-4.5 w-4.5" aria-hidden="true" />
            {t("auction.bidNow")}
          </Link>
        </div>
      </div>

      {auctions.length > 1 && (
        <>
          <IconButton
            onClick={() => step(-1)}
            aria-label={t("common.previous")}
            className="absolute top-1/2 -translate-y-1/2 start-3"
          >
            <Prev className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={() => step(1)}
            aria-label={t("common.next")}
            className="absolute top-1/2 -translate-y-1/2 end-3"
          >
            <Next className="h-5 w-5" aria-hidden="true" />
          </IconButton>

          <div className="flex items-center justify-center gap-1.5 pb-4" role="tablist" aria-label={t("home.liveAuctions")}>
            {auctions.map((a, i) => (
              <button
                key={a._id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-(--duration-base)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  i === index ? "w-6 bg-(--color-gold)" : "w-1.5 bg-(--color-border-strong) hover:bg-(--color-text-faint)"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
