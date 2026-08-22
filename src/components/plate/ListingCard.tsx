"use client";

import Link from "next/link";
import { Crown, Tag } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatSar } from "@/lib/format";
import { plateClassificationLabel, usageTypeLabel } from "@/lib/constants";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { PlateDTO } from "@/types/dto";

/**
 * Deliberately distinct from AuctionCard: a plain "For Sale" tag instead of
 * a live/scheduled status badge, no countdown, and the real uploaded photo
 * as the primary image (never the generated PlateRenderer) — so a visitor
 * never mistakes a marketplace listing for a live auction.
 */
export function ListingCard({ listing }: { listing: PlateDTO }) {
  const { t, locale } = useTranslations();

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-all duration-(--duration-base) hover:-translate-y-1 hover:shadow-(--shadow-elevated)", listing.isVip && "border-(--color-vip-border) bg-(--color-vip-surface)")}>
      <Link href={`/listings/${listing._id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[4/3] bg-(--color-bg-elevated) overflow-hidden">
          {listing.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.image} alt={listing.title ?? ""} className="h-full w-full object-cover transition-transform duration-(--duration-base) group-hover:scale-[1.03]" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-(--color-text-faint) text-xs">{t("pages.noImage")}</div>
          )}
          <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1.5">
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
