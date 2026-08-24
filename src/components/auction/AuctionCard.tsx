"use client";

import Link from "next/link";
import { Gavel, Zap, Clock4, CalendarDays, ArrowLeft, ArrowRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { VipBadge, ExclusiveBadge } from "@/components/ui/VipBadge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { statusAccent, isFinalStatus } from "@/lib/auctionStatus";
import { formatDateTime } from "@/lib/format";
import { plateTypeLabel } from "@/lib/constants";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

export function AuctionCard({ auction, className }: { auction: AuctionSummary; className?: string }) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const isLive = auction.status === "live";
  const isScheduled = auction.status === "scheduled";
  const isFinal = isFinalStatus(auction.status);
  const isVip = auction.plate.isVip;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-(--radius-lg) border",
        "transition-[transform,border-color,background-color] duration-(--duration-base) ease-(--ease-out-expo)",
        "hover:-translate-y-0.5 hover:border-(--color-gold)/45 hover:bg-(--color-surface-hover)",
        "focus-within:border-(--color-gold)/45",
        isVip ? "border-(--color-vip-border) bg-(--color-vip-surface)" : "border-(--color-border) bg-(--color-surface)",
        className
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", statusAccent[auction.status] ?? "bg-(--color-border-strong)")} aria-hidden="true" />

      <Link
        href={`/auctions/${auction._id}`}
        className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-gold)"
      >
        <div className={cn("relative flex flex-col gap-4 p-4 pt-5", isVip ? "bg-transparent" : "bg-(--color-bg-elevated)")}>

          <div className="relative flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isVip && <VipBadge />}
              {auction.category === "exclusive" && <ExclusiveBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              {isLive && auction.directPurchaseEnabled && (
                <Badge tone="gold">
                  <Zap className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
                  {t("auction.buyNow")}
                </Badge>
              )}
              <AuctionStatusBadge status={auction.status} />
            </div>
          </div>

          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-(--radius-md) bg-(--color-bg)">
            {/* Always drawn from the plate's own record. The uploaded photo
                is submission evidence, not artwork — rendering it here put
                a different plate's characters on the card. */}
            <SaudiPlate
              type={auction.plate.type}
              usageType={auction.plate.usageType}
              shape={auction.plate.shape}
              classification={auction.plate.classification}
              lettersAr={auction.plate.lettersAr}
              lettersEn={auction.plate.lettersEn}
              numbers={auction.plate.numbers}
              logo={auction.plate.logo}
              size="md"
              vip={isVip}
              locale={locale}
              className="transition-transform duration-(--duration-base) ease-(--ease-out-expo) group-hover:scale-[1.015]"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-(--color-text-muted)">{plateTypeLabel(auction.plate.type, locale)}</span>
            {auction.bidCount > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-(--color-text-faint)">
                <Gavel className="h-3 w-3" aria-hidden="true" strokeWidth={1.75} />
                <span className="tnum">{t("auction.bidsCount", { count: auction.bidCount })}</span>
              </span>
            )}
          </div>

          <PriceDisplay
            amount={isFinal ? auction.finalPrice ?? auction.currentPrice : auction.currentPrice}
            label={isFinal ? t("auction.finalPrice") : t("auction.currentPrice")}
            size="md"
            tone={auction.status === "sold" || auction.status === "purchased" ? "success" : "gold"}
          />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-(--color-border) bg-(--color-bg-elevated) px-4 py-3 text-xs">
        {isLive ? (
          <>
            <span className="flex items-center gap-1.5 text-(--color-text-muted)">
              <Clock4 className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
              {t("auction.endsIn")}
            </span>
            <CountdownTimer endAt={auction.endAt} urgency className="text-sm font-semibold text-(--color-text)" />
          </>
        ) : isScheduled ? (
          <>
            <span className="flex items-center gap-1.5 text-(--color-text-muted)">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
              {t("auction.startsAt")}
            </span>
            <span className="tnum truncate text-sm font-medium text-(--color-text)">
              {formatDateTime(auction.startAt, locale)}
            </span>
          </>
        ) : (
          <>
            <span className="tnum truncate text-(--color-text-faint)">
              {formatDateTime(auction.finalizedAt ?? auction.endAt, locale)}
            </span>
            <Link href={`/auctions/${auction._id}`} className="flex shrink-0 items-center gap-1 text-sm font-medium text-(--color-gold) transition-colors hover:text-(--color-gold-hover)">
              {t("auction.viewDetails")}
              <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
