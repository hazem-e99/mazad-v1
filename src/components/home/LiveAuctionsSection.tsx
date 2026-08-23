"use client";

import { useMemo } from "react";
import { Gavel } from "lucide-react";
import { LiveAuctionSpotlight } from "@/components/home/LiveAuctionSpotlight";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useAuctionRooms } from "@/hooks/useAuctionRooms";
import type { AuctionSummary } from "@/types/auction";

/**
 * Owns the home page's live-auction realtime subscription.
 *
 * It wraps *both* the stage and its empty state on purpose. The section
 * has to keep listening when there is nothing live right now — that is
 * exactly the case where an incoming `auction_started` should replace the
 * empty state with a running auction. A hook mounted inside the spotlight
 * would only ever run once the page already had something to show.
 *
 * `watchIds` therefore covers the scheduled auctions as well as the live
 * ones: an auction about to open still has to be heard from, and the
 * scheduler emits `auction_started` into its room (see auctionService).
 */
export function LiveAuctionsSection({
  auctions,
  watchIds,
}: {
  auctions: AuctionSummary[];
  watchIds: string[];
}) {
  const { t } = useTranslations();
  const { snapshotFor } = useAuctionRooms(watchIds);

  // Server-rendered row first, live snapshot on top of it — so the section
  // paints correct data on the first byte and tracks the database from
  // there. Every field replaced here is one the server also owns; nothing
  // is computed in the browser.
  const merged = useMemo(
    () =>
      auctions.map((auction) => {
        const snapshot = snapshotFor(auction._id);
        if (!snapshot) return auction;
        return {
          ...auction,
          status: snapshot.status,
          currentPrice: snapshot.currentPrice,
          minIncrement: snapshot.minIncrement,
          bidCount: snapshot.bidCount,
          endAt: snapshot.endAt,
          highestBidder: snapshot.highestBidderId
            ? { _id: snapshot.highestBidderId, name: snapshot.highestBidderName ?? "", phone: "" }
            : null,
        };
      }),
    [auctions, snapshotFor]
  );

  if (merged.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title={t("home.noLiveAuctions")}
        description={t("home.noLiveAuctionsHint")}
        action={
          <LinkButton href="/auctions?status=scheduled" variant="secondary" size="md">
            {t("home.browseUpcoming")}
          </LinkButton>
        }
      />
    );
  }

  return <LiveAuctionSpotlight auctions={merged} />;
}
