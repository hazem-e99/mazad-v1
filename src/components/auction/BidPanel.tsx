"use client";

import { useRef, useState } from "react";
import { Wifi, WifiOff, Minus, Plus, Gavel, Trophy, Zap, Eye } from "lucide-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatSar, formatDateTime } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { isFinalStatus } from "@/lib/auctionStatus";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

interface RecentBid {
  _id: string;
  amount: number;
  createdAt: string;
  user: { _id: string; name: string };
}

interface BidPanelProps {
  auction: AuctionSummary;
  recentBids: RecentBid[];
  isAuthenticated: boolean;
  canBuy: boolean;
  currentUserId?: string;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function BidPanel({
  auction: initialAuction,
  recentBids: initialBids,
  isAuthenticated,
  canBuy,
  currentUserId,
}: BidPanelProps) {
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [auction, setAuction] = useState(initialAuction);
  const [bids, setBids] = useState(initialBids);
  const [bidAmount, setBidAmount] = useState<number>(initialAuction.currentPrice + initialAuction.minIncrement);
  const [submitting, setSubmitting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [bidsPage, setBidsPage] = useState(1);
  const [loadingMoreBids, setLoadingMoreBids] = useState(false);
  // The server seeds this page with the first 20 (see the auction detail
  // page's own query) — fewer than that means there was nothing more to
  // begin with, so "عرض المزيد" only shows once there's a real chance of
  // more history beyond what's already loaded.
  const [hasMoreBids, setHasMoreBids] = useState(initialBids.length >= 20);
  const lastHighestBidderId = useRef<string | undefined>(initialAuction.highestBidder?._id);

  async function loadMoreBids() {
    setLoadingMoreBids(true);
    try {
      const nextPage = bidsPage + 1;
      const data = await apiFetch<{ items: RecentBid[]; pages: number }>(
        `/api/auctions/${auction._id}/bids?page=${nextPage}&limit=20`
      );
      // Deduped by id: a realtime bid landing between page loads shifts the
      // server's offset-based pages by one, which could otherwise repeat
      // the boundary item here.
      setBids((prev) => {
        const seen = new Set(prev.map((b) => b._id));
        return [...prev, ...data.items.filter((b) => !seen.has(b._id))];
      });
      setBidsPage(nextPage);
      setHasMoreBids(nextPage < data.pages);
    } catch {
      // Best-effort — the button stays available to retry.
    } finally {
      setLoadingMoreBids(false);
    }
  }

  // On a reconnect after a real gap (not the initial mount), re-fetch the
  // canonical auction state rather than trusting whatever price/bid-count
  // this tab had cached while offline — a missed event during the gap
  // would otherwise never get corrected.
  async function resync() {
    try {
      const data = await apiFetch<{
        auction: {
          status: AuctionSummary["status"];
          currentPrice: number;
          bidCount: number;
          endAt: string;
          finalPrice: number | null;
        };
      }>(`/api/auctions/${auction._id}`);
      // Only the scalar fields this panel actually drives are merged — the
      // raw endpoint's `plate`/`highestBidder`/etc. shapes aren't the same
      // DTO this component was seeded with, so they're deliberately left
      // untouched rather than risking a shape mismatch.
      setAuction((prev) => ({
        ...prev,
        status: data.auction.status,
        currentPrice: data.auction.currentPrice,
        bidCount: data.auction.bidCount,
        endAt: data.auction.endAt,
        finalPrice: data.auction.finalPrice,
      }));
    } catch {
      // Best-effort — the socket stays the primary source of truth for
      // subsequent live events either way.
    }
  }

  const { connected } = useAuctionSocket(
    auction._id,
    (event) => {
    if (event.auctionId !== auction._id) return;

    if (event.type === "bid_accepted") {
      setAuction((prev) => ({ ...prev, currentPrice: event.amount, endAt: event.endAt, bidCount: prev.bidCount + 1 }));
      setBidAmount(event.amount + auction.minIncrement);
      setBids((prev) => [
        {
          _id: `${event.auctionId}-${event.amount}-${Date.now()}`,
          amount: event.amount,
          createdAt: new Date().toISOString(),
          user: { _id: event.bidderId, name: event.bidderName },
        },
        ...prev,
      ]);
      if (currentUserId && lastHighestBidderId.current === currentUserId && event.bidderId !== currentUserId) {
        push(t("auction.outbid"), "info");
      } else if (!currentUserId || event.bidderId !== currentUserId) {
        // Skip the generic toast for the bidder's own successful bid — the
        // submit handler's "bid accepted" toast already covers it, so
        // showing both would just be the same event announced twice.
        push(t("auction.bidReceived"), "info");
      }
      lastHighestBidderId.current = event.bidderId;
    } else if (event.type === "auction_finalized") {
      setAuction((prev) => ({
        ...prev,
        status: event.status as AuctionSummary["status"],
        finalPrice: event.finalPrice ?? prev.finalPrice,
      }));
      push(event.status === "sold" ? t("auction.auctionSoldEnded") : t("auction.auctionUnsoldEnded"), "info");
    } else if (event.type === "direct_purchase") {
      setAuction((prev) => ({ ...prev, status: "purchased" }));
      push(t("auction.purchaseCompleted"), "info");
    }
    },
    resync,
    setViewerCount
  );

  async function submitBid() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/auctions/${auction._id}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount: bidAmount }),
      });
      push(t("auction.bidAccepted"), "success");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "unauthorized") push(t("auction.mustLoginToBid"), "error");
        else push(err.message, "error");
      } else {
        push(t("common.error"), "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPurchase() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      await apiFetch(`/api/auctions/${auction._id}/purchase`, { method: "POST" });
      push(t("auction.purchaseSuccess"), "success");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t("common.error");
      push(message, "error");
    } finally {
      setPurchasing(false);
    }
  }

  const isLive = auction.status === "live";
  const isFinal = isFinalStatus(auction.status);
  const minAcceptable = auction.currentPrice + auction.minIncrement;

  return (
    // Sticky on desktop so the price and the bid button stay in reach
    // while the specs column scrolls; static on mobile, where the action
    // bar below pins itself instead.
    <div className="flex flex-col gap-5 lg:sticky lg:top-24">
      {/* ── Price + countdown ──────────────────────────────────────── */}
      <section
        className={cn(
          "relative overflow-hidden rounded-(--radius-xl) border p-5 sm:p-6",
          isLive ? "border-(--color-gold)/30 bg-(--color-bg-elevated)" : "border-(--color-border) bg-(--color-surface)"
        )}
        aria-label={t("auction.auctionDetails")}
      >
        <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AuctionStatusBadge status={auction.status} className="px-3 py-1.5 text-sm" />
            {isLive && viewerCount != null && viewerCount > 0 && (
              <span
                key={viewerCount}
                className="animate-value-pulse flex items-center gap-1.5 rounded-full bg-(--color-bg-elevated) px-2.5 py-1 text-xs font-medium text-(--color-text-muted)"
                role="status"
                aria-live="polite"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
                <span className="tnum">{t("auction.viewerCount", { count: viewerCount })}</span>
              </span>
            )}
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              connected ? "text-(--color-text-faint)" : "bg-(--color-danger)/12 text-(--color-danger)"
            )}
            role="status"
            aria-live="polite"
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
            ) : (
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
            )}
            {connected ? t("auction.connected") : t("auction.reconnecting")}
          </span>
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div key={auction.currentPrice} className="animate-value-pulse rounded-(--radius-sm)">
            <PriceDisplay
              amount={isFinal ? auction.finalPrice ?? auction.currentPrice : auction.currentPrice}
              label={isFinal ? t("auction.finalPrice") : t("auction.currentPrice")}
              size="xl"
              tone={auction.status === "sold" || auction.status === "purchased" ? "success" : "gold"}
            />
          </div>

          {isLive && (
            <div>
              <p className="mb-2 text-xs text-(--color-text-muted)">{t("auction.timeRemaining")}</p>
              <CountdownTimer endAt={auction.endAt} variant="blocks" size="sm" urgency />
            </div>
          )}
        </div>

        {(isLive || auction.highestBidder) && (
          <dl className="relative mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-(--color-border) pt-4 text-xs">
            {isLive && (
              <div className="flex items-center gap-1.5">
                <dt className="text-(--color-text-faint)">{t("auction.minNextBid")}</dt>
                <dd className="tnum font-semibold text-(--color-text-muted)">{formatSar(minAcceptable, locale)}</dd>
              </div>
            )}
            {auction.highestBidder && (
              <div className="flex items-center gap-1.5">
                <dt className="text-(--color-text-faint)">{t("auction.highestBidder")}</dt>
                <dd className="font-semibold text-(--color-text-muted)">{auction.highestBidder.name}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <dt className="text-(--color-text-faint)">{t("auction.bidsLabel")}</dt>
              <dd className="tnum font-semibold text-(--color-text-muted)">{auction.bidCount}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* ── Bidding ────────────────────────────────────────────────── */}
      {isLive && (
        <div
          className={cn(
            "z-20 flex flex-col gap-3 rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg)/95 p-4",
            "sticky bottom-3 lg:static lg:border-(--color-border) lg:bg-(--color-surface)"
          )}
          aria-label={t("auction.stickyBidLabel")}
        >
          {!isAuthenticated ? (
            <p className="py-1 text-center text-sm text-(--color-text-muted)">
              <a href="/login" className="font-semibold text-(--color-gold) hover:text-(--color-gold-hover)">
                {t("auth.signIn")}
              </a>{" "}
              — {t("auction.mustLoginToBid")}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBidAmount((v) => v + auction.minIncrement)}
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-border-strong) text-(--color-text) transition-[background-color,transform] hover:bg-(--color-surface-hover) active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                  aria-label={t("auction.increaseBidAmount")}
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
                <input
                  type="number"
                  value={bidAmount}
                  min={minAcceptable}
                  step={auction.minIncrement}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="tnum h-13 min-w-0 flex-1 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-center text-lg font-bold text-(--color-text) focus:border-(--color-gold)/60 focus:outline-none focus:ring-2 focus:ring-(--color-gold)/25"
                  aria-label={t("auction.placeBid")}
                />
                <button
                  type="button"
                  onClick={() => setBidAmount((v) => Math.max(minAcceptable, v - auction.minIncrement))}
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-border-strong) text-(--color-text) transition-[background-color,transform] hover:bg-(--color-surface-hover) active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                  aria-label={t("auction.decreaseBidAmount")}
                >
                  <Minus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <Button
                variant="gold"
                size="lg"
                loading={submitting}
                onClick={submitBid}
                disabled={bidAmount < minAcceptable}
                className="w-full"
              >
                <Gavel className="h-4.5 w-4.5" aria-hidden="true" />
                {t("auction.bidNow")}
              </Button>
            </>
          )}

          {auction.directPurchaseEnabled && auction.directPurchasePrice && (
            <div className="flex items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-gold)/30 bg-(--color-gold-tint) p-4">
              <span className="flex items-center gap-2.5">
                <Zap className="h-4.5 w-4.5 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                <PriceDisplay amount={auction.directPurchasePrice} label={t("auction.directPurchase")} size="md" />
              </span>
              <Button
                variant="secondary"
                size="md"
                loading={purchasing}
                disabled={!isAuthenticated || !canBuy}
                onClick={submitPurchase}
              >
                {t("auction.buyNow")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────── */}
      {!isLive && auction.status !== "scheduled" && (
        <section
          className={cn(
            "rounded-(--radius-xl) border p-6 text-center",
            auction.winner ? "border-(--color-sold)/30 bg-(--color-sold-bg)" : "border-(--color-border) bg-(--color-surface)"
          )}
        >
          {auction.winner ? (
            <div className="flex flex-col items-center gap-2">
              <Trophy className="h-7 w-7 text-(--color-sold)" aria-hidden="true" strokeWidth={1.5} />
              <p className="text-(--color-text)">
                {t("auction.winner")}: <span className="font-semibold">{auction.winner.name}</span>
              </p>
              <PriceDisplay amount={auction.finalPrice ?? 0} size="lg" tone="success" className="items-center" />
            </div>
          ) : (
            <p className="text-(--color-text-muted)">{t("auction.endedNoBids")}</p>
          )}
        </section>
      )}

      {/* ── Bid history ────────────────────────────────────────────── */}
      {(isLive || bids.length > 0) && (
        <section className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-5">
          <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
            <Gavel className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
            {isLive ? t("auction.recentBids") : t("auction.bidHistory")}
          </h3>

          {bids.length === 0 ? (
            <p className="py-4 text-center text-sm text-(--color-text-faint)">{t("auction.noBidsYet")}</p>
          ) : (
            <>
              <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
                {bids.map((bid, i) => {
                  const isMine = currentUserId && bid.user._id === currentUserId;
                  return (
                    <li
                      key={bid._id}
                      className={cn(
                        "flex items-center gap-3 rounded-(--radius-md) px-3 py-2.5 text-sm",
                        isMine
                          ? "border border-(--color-gold)/25 bg-(--color-gold-tint)"
                          : "bg-(--color-bg-elevated)",
                        i === 0 && "animate-rise-in"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          i === 0
                            ? "bg-(--color-gold) text-(--color-gold-foreground)"
                            : "bg-(--color-surface-hover) text-(--color-text-muted)"
                        )}
                        aria-hidden="true"
                      >
                        {initials(bid.user.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-(--color-text-muted)">
                        {isMine ? t("auction.youLabel") : bid.user.name}
                      </span>
                      {i === 0 && (
                        <span className="shrink-0 rounded-(--radius-pill) bg-(--color-gold-tint) px-2 py-0.5 text-[11px] font-semibold text-(--color-gold)">
                          {t("auction.highestBidBadge")}
                        </span>
                      )}
                      <span className="tnum shrink-0 font-semibold text-(--color-text)">
                        {formatSar(bid.amount, locale)}
                      </span>
                      <span className="tnum hidden shrink-0 text-xs text-(--color-text-faint) sm:inline">
                        {formatDateTime(bid.createdAt, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {hasMoreBids && (
                <div className="mt-3 flex justify-center">
                  <Button variant="ghost" size="sm" loading={loadingMoreBids} onClick={loadMoreBids}>
                    {t("auction.loadMoreBids")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
