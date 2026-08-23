"use client";

import Link from "next/link";
import { Crown, Tag } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { Badge } from "@/components/ui/Badge";
import { formatSar } from "@/lib/format";
import { plateClassificationLabel, usageTypeLabel } from "@/lib/constants";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { PlateDTO } from "@/types/dto";

/**
 * Deliberately distinct from AuctionCard: a plain "For Sale" tag instead of
 * a live/scheduled status badge, no countdown, and the real uploaded photo
 * as the primary image (never the generated SaudiPlate) — so a visitor
 * never mistakes a marketplace listing for a live auction.
 */
export function ListingCard({ listing }: { listing: PlateDTO }) {
  const { t, locale } = useTranslations();

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-[transform,border-color,background-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-(--color-gold)/35 hover:bg-(--color-surface-hover)", listing.isVip && "border-(--color-vip-border) bg-(--color-vip-surface)")}>
      <Link href={`/listings/${listing._id}`} className="flex flex-col flex-1">
        {/* The plate is drawn from this listing's own letters, numbers and
            logo. The seller's uploaded photo is evidence for moderation,
            not the artwork: shown here it would put another plate's
            characters on this card whenever the upload is a placeholder or
            a stock shot. `pt-11` keeps it clear of the badges above. */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-(--color-bg-elevated) p-3 pt-11">
          <SaudiPlate
            type={listing.type}
            lettersAr={listing.lettersAr}
            lettersEn={listing.lettersEn}
            numbers={listing.numbers}
            logo={listing.logo}
            size="xl"
            vip={listing.isVip}
            locale={locale}
            className="transition-transform duration-(--duration-base) group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
            <Badge tone="neutral" className="gap-1 bg-(--color-surface)/90">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {t("pages.forSaleBadge")}
            </Badge>
            {listing.isVip && (
              <Badge tone="vip" className="gap-1">
                <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                {t("auction.vipBadge")}
              </Badge>
            )}
          </div>
        </div>

        <CardBody className="flex-1 flex flex-col gap-2">
          <p className="font-semibold text-(--color-text) truncate">{listing.title}</p>
          <div className="flex flex-wrap gap-1.5 text-xs text-(--color-text-muted)">
            {listing.classification && <span>{plateClassificationLabel(listing.classification, locale)}</span>}
            {listing.classification && listing.usageType && <span>·</span>}
            {listing.usageType && <span>{usageTypeLabel(listing.usageType, locale)}</span>}
          </div>
          <span className="tnum text-lg font-bold text-(--color-gold) mt-auto">{listing.price != null ? formatSar(listing.price, locale) : "—"}</span>
        </CardBody>
      </Link>
    </Card>
  );
}
