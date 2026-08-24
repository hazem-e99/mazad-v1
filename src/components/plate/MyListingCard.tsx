import Link from "next/link";
import { Crown } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { formatSar, formatDateTime } from "@/lib/format";
import { plateTypeLabel } from "@/lib/constants";
import type { AuctionStatus } from "@/lib/constants";
import type { PlateDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

export interface ListingAuctionLink {
  auctionId: string;
  status: AuctionStatus;
  currentPrice: number;
  finalPrice: number | null;
}

interface Props {
  listing: PlateDTO;
  auction: ListingAuctionLink | undefined;
  createAuctionAction: { kind: "link" } | { kind: "blocked"; reason: string } | null;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * One card in /my-listings' grid (§ my-listings redesign, matching the
 * production "لوحاتي" card-grid layout: type label + optional VIP badge,
 * the plate itself, a price/status line, and a footer action). Server
 * component — no interactivity beyond plain links.
 */
export function MyListingCard({ listing, auction, createAuctionAction, locale, t }: Props) {
  const href = auction ? `/auctions/${auction.auctionId}` : `/listings/${listing._id}`;

  // A plate this owner submitted but never wrapped in an auction, and that
  // isn't itself pending/rejected, is the "غير نشطة" catch-all — matching
  // the production dashboard's largest bucket. A marketplace listing with
  // no auction is described as "معروضة للبيع" instead: it *is* live and
  // reachable via WhatsApp contact, just not literally sold, so it isn't
  // labelled "مباع" here even though the reference screenshot's copy
  // reads that way — see the my-listings redesign note on this call.
  const price = auction ? (auction.finalPrice ?? auction.currentPrice) : listing.price;

  return (
    <div className="flex flex-col rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-(--color-text-muted)">{plateTypeLabel(listing.type, locale)}</span>
        {listing.isVip && (
          <span className="inline-flex items-center gap-1 rounded-(--radius-pill) bg-(--color-gold-tint) px-2 py-0.5 text-[11px] font-bold text-(--color-gold-dark)">
            <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.4} />
            VIP
          </span>
        )}
      </div>

      <Link href={href} className="flex min-h-[4.5rem] flex-1 items-center justify-center rounded-(--radius-md) bg-(--color-bg-elevated) p-3">
        <SaudiPlate
          type={listing.type}
          usageType={listing.usageType}
          shape={listing.shape}
          classification={listing.classification}
          lettersAr={listing.lettersAr}
          lettersEn={listing.lettersEn}
          numbers={listing.numbers}
          logo={listing.logo}
          size="lg"
          vip={listing.isVip}
          locale={locale}
        />
      </Link>

      {price != null && (
        <p className="tnum mt-3 text-center text-lg font-bold text-(--color-gold)">{formatSar(price, locale)}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-(--color-border) pt-3 text-xs">
        <span className="text-(--color-text-faint)">{formatDateTime(listing.createdAt, locale)}</span>
        {auction ? (
          <AuctionStatusBadge status={auction.status} />
        ) : listing.moderationStatus === "pending" ? (
          <Badge tone="scheduled">{t("pages.moderationStatus_pending")}</Badge>
        ) : listing.moderationStatus === "rejected" ? (
          <Badge tone="unsold">{t("pages.moderationStatus_rejected")}</Badge>
        ) : listing.submissionType === "marketplace" ? (
          <Badge tone="info">{t("pages.listingForSale")}</Badge>
        ) : (
          <Badge tone="neutral">{t("pages.listingInactive")}</Badge>
        )}
      </div>

      {listing.moderationStatus === "rejected" && (
        <>
          {listing.rejectionReason && (
            <p className="mt-1.5 text-[11px] text-(--color-danger)">
              {t("pages.rejectionReasonLabel")}: {listing.rejectionReason}
            </p>
          )}
          <div className="mt-2 text-center">
            <Link
              href={`/plates/${listing._id}/edit`}
              className="text-xs font-semibold text-(--color-gold) hover:text-(--color-gold-hover)"
            >
              {t("pages.resubmitAction")}
            </Link>
          </div>
        </>
      )}

      {createAuctionAction && (
        <div className="mt-2 text-center">
          {createAuctionAction.kind === "link" ? (
            <Link
              href={`/my-listings/${listing._id}/auction/new`}
              className="text-xs font-semibold text-(--color-gold) hover:text-(--color-gold-hover)"
            >
              {t("pages.createAuctionAction")}
            </Link>
          ) : (
            <span className="text-[11px] text-(--color-text-faint)">{createAuctionAction.reason}</span>
          )}
        </div>
      )}
    </div>
  );
}
