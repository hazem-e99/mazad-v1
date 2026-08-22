"use client";

import Link from "next/link";
import { Gavel, ArrowLeft, ArrowRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Badge } from "@/components/ui/Badge";
import { VipBadge } from "@/components/ui/VipBadge";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

/**
 * The hero's centrepiece: one auction presented at full weight. Dark
 * glass over the backdrop, a gold hairline, and the plate lit from behind
 * — the only place on the page where the glow is allowed to touch the
 * plate itself.
 */
export function FeaturedAuctionCard({ auction, className }: { auction: AuctionSummary; className?: string }) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const isLive = auction.status === "live";
  const isScheduled = auction.status === "scheduled";

  return (
    <article
      className={cn(
        "mz-edge-gold relative overflow-hidden rounded-(--radius-xl) border border-(--color-gold)/22",
        "bg-(--color-bg-elevated)/75 p-5 shadow-(--shadow-elevated) backdrop-blur-xl sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        {isLive ? (
          <Badge tone="live" dot className="px-3 py-1.5">
            {t("home.featuredNow")}
          </Badge>
        ) : (
          <Badge tone="scheduled" className="px-3 py-1.5">
            {t("home.nextAuction")}
          </Badge>
        )}
        {auction.plate.isVip && <VipBadge />}
      </div>

      {/* Plate stage */}
      <Link
        href={`/auctions/${auction._id}`}
        className="group relative mb-6 flex items-center justify-center rounded-(--radius-lg) border border-(--color-border) bg-black/25 px-4 py-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      >
        <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-0" />
        <SaudiPlate
          type={auction.plate.type}
          lettersAr={auction.plate.lettersAr}
          lettersEn={auction.plate.lettersEn}
          numbers={auction.plate.numbers}
          logo={auction.plate.logo}
          size="xl"
          vip={auction.plate.isVip}
          locale={locale}
          className="relative transition-transform duration-(--duration-base) ease-(--ease-out-expo) group-hover:scale-[1.015]"
        />
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-5">
        <PriceDisplay
          amount={auction.currentPrice}
          label={t("auction.currentPrice")}
          size="lg"
          className="shrink-0"
        />

        {isLive ? (
          <div className="shrink-0">
            <p className="mb-2 text-xs text-(--color-text-muted)">{t("auction.endsIn")}</p>
            <CountdownTimer endAt={auction.endAt} variant="blocks" size="sm" urgency />
          </div>
        ) : isScheduled ? (
          <div className="shrink-0">
            <p className="mb-2 text-xs text-(--color-text-muted)">{t("auction.startsIn")}</p>
            <CountdownTimer endAt={auction.startAt} variant="blocks" size="sm" />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-(--color-border) pt-4">
        <span className="flex items-center gap-1.5 text-xs text-(--color-text-faint)">
          <Gavel className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
          <span className="tnum">{t("auction.bidsCount", { count: auction.bidCount })}</span>
        </span>

        <Link
          href={`/auctions/${auction._id}`}
          className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) border border-(--color-gold)/40 px-5 text-sm font-semibold text-(--color-gold) transition-colors duration-(--duration-fast) hover:bg-(--color-gold-tint) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          {t("home.viewAuction")}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
