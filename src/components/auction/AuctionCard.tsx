"use client";

import Link from "next/link";
import { Crown, Sparkles, Gavel, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { formatSar } from "@/lib/format";
import { plateTypeLabel } from "@/lib/constants";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

const statusTone: Record<string, "live" | "scheduled" | "sold" | "unsold"> = {
  live: "live",
  scheduled: "scheduled",
  sold: "sold",
  unsold: "unsold",
  purchased: "sold",
  ended: "unsold",
};

// Top-edge accent + subtle surface wash per status — gives each state a
// distinct silhouette at a glance without relying on a banned colored
// left/right border on the card.
const statusAccent: Record<string, string> = {
  live: "bg-(--color-live)",
  scheduled: "bg-(--color-scheduled)",
  sold: "bg-(--color-sold)",
  purchased: "bg-(--color-sold)",
  unsold: "bg-(--color-border-strong)",
  ended: "bg-(--color-border-strong)",
};

export function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const statusLabelMap: Record<string, string> = {
    live: t("auction.live"),
    scheduled: t("auction.scheduled"),
    sold: t("auction.sold"),
    unsold: t("auction.unsold"),
    purchased: t("auction.purchased"),
    ended: t("auction.ended"),
  };

  const tone = statusTone[auction.status] ?? "unsold";
  const label = statusLabelMap[auction.status] ?? auction.status;
  const isLive = auction.status === "live";
  const isFinal = auction.status === "sold" || auction.status === "unsold" || auction.status === "purchased";
  const isVip = auction.plate.isVip;

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-(--duration-base)",
        "hover:-translate-y-1 hover:shadow-(--shadow-elevated)",
        isVip && "border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow)"
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", statusAccent[auction.status] ?? "bg-(--color-border-strong)")} aria-hidden="true" />

      <Link href={`/auctions/${auction._id}`} className="flex flex-col flex-1">
        <div
          className={cn(
            "relative flex flex-col gap-3 p-4 sm:p-5 pt-4",
            isVip
              ? "bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.16),transparent_70%)]"
              : "bg-(--color-bg-elevated)"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isVip && (
                <Badge tone="vip" className="gap-1">
                  <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                  {t("auction.vipBadge")}
                </Badge>
              )}
              {auction.category === "exclusive" && (
                <Badge tone="gold" className="gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                  {t("auction.exclusiveBadge")}
                </Badge>
              )}
            </div>
            <Badge tone={tone} dot={isLive}>
              {label}
            </Badge>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-(--radius-md) bg-(--color-bg)">
            {auction.plate.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={auction.plate.image}
                alt={auction.plate.title ?? `${auction.plate.lettersAr} ${auction.plate.numbers}`}
                className="h-full w-full object-cover transition-transform duration-(--duration-base) group-hover:scale-[1.03]"
              />
            ) : (
              <PlateRenderer
                type={auction.plate.type}
                lettersAr={auction.plate.lettersAr}
                lettersEn={auction.plate.lettersEn}
                numbers={auction.plate.numbers}
                logo={auction.plate.logo}
                size="md"
                locale={locale}
                className="transition-transform duration-(--duration-base) group-hover:scale-[1.03]"
              />
            )}
          </div>
        </div>

        <CardBody className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--color-text-muted)">{plateTypeLabel(auction.plate.type, locale)}</span>
            {auction.bidCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-(--color-text-faint)">
                <Gavel className="h-3 w-3" aria-hidden="true" />
                {t("auction.bidsCount", { count: auction.bidCount })}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-(--color-text-muted)">
              {isFinal ? t("auction.finalPrice") : t("auction.currentPrice")}
            </span>
            <span className={cn("tnum text-xl font-bold", isFinal ? "text-(--color-text)" : "text-(--color-gold)")}>
              {formatSar(isFinal ? auction.finalPrice ?? auction.currentPrice : auction.currentPrice, locale)}
            </span>
          </div>
        </CardBody>
      </Link>

      <div className="flex items-center justify-between border-t border-(--color-border) bg-(--color-bg-elevated)/40 px-4 sm:px-5 py-3">
        <span className="text-xs text-(--color-text-muted)">
          {auction.status === "live" ? t("auction.endsIn") : auction.status === "scheduled" ? t("auction.startsIn") : ""}
        </span>
        {auction.status === "live" ? (
          <CountdownTimer endAt={auction.endAt} className="text-sm font-semibold tnum text-(--color-text)" />
        ) : auction.status === "scheduled" ? (
          <span className="tnum text-sm font-semibold text-(--color-text)">{t("auction.startingSoon")}</span>
        ) : (
          <Link
            href={`/auctions/${auction._id}`}
            className="flex items-center gap-1 text-sm font-medium text-(--color-gold) hover:text-(--color-gold-hover)"
          >
            {t("auction.viewDetails")}
            <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </Card>
  );
}
