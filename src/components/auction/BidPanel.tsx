"use client";

import { useRef, useState } from "react";
import { Wifi, WifiOff, Minus, Plus, Gavel, Trophy, Crown } from "lucide-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatSar, formatDateTime } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
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

export function BidPanel({ auction: initialAuction, recentBids: initialBids, isAuthenticated, canBuy, currentUserId }: BidPanelProps) {
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [auction, setAuction] = useState(initialAuction);
  const [bids, setBids] = useState(initialBids);
  const [bidAmount, setBidAmount] = useState<number>(initialAuction.currentPrice + initialAuction.minIncrement);
  const [submitting, setSubmitting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const lastHighestBidderId = useRef<string | undefined>(initialAuction.highestBidder?._id);

  const statusLabel: Record<string, string> = {
    live: t("auction.liveNow"),
    scheduled: t("auction.notStartedYet"),
    ended: t("auction.ended"),
    sold: t("auction.sold"),
    unsold: t("auction.unsold"),
    purchased: t("auction.purchasedDirect"),
    cancelled: t("auction.cancelled"),
  };

  const { connected } = useAuctionSocket(auction._id, (event) => {
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
  });

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
  const isFinalState = auction.status === "sold" || auction.status === "unsold" || auction.status === "purchased";
  const minAcceptable = auction.currentPrice + auction.minIncrement;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Badge tone={isLive ? "live" : auction.status === "scheduled" ? "scheduled" : "neutral"} dot={isLive} className="text-sm px-3 py-1.5">
          {statusLabel[auction.status] ?? auction.status}
        </Badge>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            connected ? "text-(--color-text-faint)" : "bg-(--color-danger)/10 text-(--color-danger)"
          )}
          role="status"
          aria-live="polite"
        >
          {connected ? <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
          {connected ? t("auction.connected") : t("auction.reconnecting")}
        </span>
      </div>

      <Card className={cn("p-5", isLive && "border-(--color-gold)/25")}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-(--color-text-muted)">{isFinalState ? t("auction.finalPrice") : t("auction.currentPrice")}</p>
            <p key={auction.currentPrice} className="tnum text-3xl sm:text-4xl font-bold text-(--color-gold) rounded-(--radius-sm) animate-value-pulse">
              {formatSar(isFinalState ? auction.finalPrice ?? auction.currentPrice : auction.currentPrice, locale)}
            </p>
          </div>
          {isLive && (
            <div className="text-end">
              <p className="text-xs text-(--color-text-muted)">{t("auction.timeRemaining")}</p>
              <CountdownTimer endAt={auction.endAt} urgency className="tnum text-2xl sm:text-3xl font-bold text-(--color-text)" />
            </div>
          )}
        </div>
        {isLive && (
          <p className="text-xs text-(--color-text-faint) mt-3 pt-3 border-t border-(--color-border)">
            {t("auction.minNextBid")}: <span className="tnum font-medium text-(--color-text-muted)">{formatSar(minAcceptable, locale)}</span>
          </p>
        )}
      </Card>

      {isLive && (
        <div className="flex flex-col gap-3 sticky bottom-3 z-20 lg:static rounded-(--radius-lg) bg-(--color-bg)/95 backdrop-blur lg:backdrop-blur-none lg:bg-transparent p-3 lg:p-0 border border-(--color-border) lg:border-0 shadow-(--shadow-elevated) lg:shadow-none">
          {!isAuthenticated ? (
            <p className="text-sm text-(--color-text-muted) text-center">
              <a href="/login" className="text-(--color-gold) font-medium">
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
                  className="h-12 w-12 shrink-0 rounded-(--radius-md) border border-(--color-border-strong) flex items-center justify-center hover:bg-(--color-surface-hover) active:scale-95 transition-transform"
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
                  className="tnum h-12 min-w-0 flex-1 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-center text-lg font-bold text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                  aria-label={t("auction.placeBid")}
                />
                <button
                  type="button"
                  onClick={() => setBidAmount((v) => Math.max(minAcceptable, v - auction.minIncrement))}
                  className="h-12 w-12 shrink-0 rounded-(--radius-md) border border-(--color-border-strong) flex items-center justify-center hover:bg-(--color-surface-hover) active:scale-95 transition-transform"
                  aria-label={t("auction.decreaseBidAmount")}
                >
                  <Minus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <Button variant="gold" size="lg" loading={submitting} onClick={submitBid} disabled={bidAmount < minAcceptable} className="w-full">
                <Gavel className="h-4.5 w-4.5" aria-hidden="true" />
                {t("auction.placeBid")}
              </Button>
            </>
          )}

          {auction.directPurchaseEnabled && auction.directPurchasePrice && (
            <div className="flex items-center justify-between rounded-(--radius-md) border border-(--color-gold)/30 bg-(--color-vip-bg) p-4">
              <div>
                <p className="text-xs text-(--color-text-muted)">{t("auction.directPurchase")}</p>
                <p className="tnum text-lg font-bold text-(--color-gold)">{formatSar(auction.directPurchasePrice, locale)}</p>
              </div>
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

      {!isLive && auction.status !== "scheduled" && (
        <Card className={cn("p-5 text-center", auction.winner && "border-(--color-sold)/30 bg-(--color-sold-bg)")}>
          {auction.winner ? (
            <div className="flex flex-col items-center gap-1.5">
              <Trophy className="h-6 w-6 text-(--color-sold)" aria-hidden="true" strokeWidth={1.75} />
              <p className="text-(--color-text)">
                {t("auction.winner")}: <span className="font-semibold">{auction.winner.name}</span>
              </p>
              <p className="tnum text-xl font-bold text-(--color-gold)">{formatSar(auction.finalPrice ?? 0, locale)}</p>
            </div>
          ) : (
            <p className="text-(--color-text-muted)">{t("auction.endedNoBids")}</p>
          )}
        </Card>
      )}

      {(isLive || bids.length > 0) && (
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-(--color-text) mb-2.5">
            <Gavel className="h-4 w-4 text-(--color-text-faint)" aria-hidden="true" />
            {isLive ? t("auction.recentBids") : t("auction.liveActivity")}
          </h3>
          {bids.length === 0 ? (
            <p className="text-sm text-(--color-text-faint)">{t("auction.noBidsYet")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {bids.slice(0, 12).map((bid, i) => {
                const isMine = currentUserId && bid.user._id === currentUserId;
                return (
                  <li
                    key={bid._id}
                    className={cn(
                      "flex items-center gap-3 rounded-(--radius-md) px-3 py-2.5 text-sm",
                      isMine ? "bg-(--color-vip-bg) border border-(--color-gold)/25" : "bg-(--color-bg-elevated)",
                      i === 0 && "animate-rise-in"
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-surface-hover) text-xs font-semibold text-(--color-text-muted)">
                      {initials(bid.user.name)}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-(--color-text-muted)">
                      {isMine ? t("auction.youLabel") : bid.user.name}
                    </span>
                    <span className="tnum font-semibold text-(--color-text) shrink-0">{formatSar(bid.amount, locale)}</span>
                    <span className="hidden sm:inline text-xs text-(--color-text-faint) shrink-0">{formatDateTime(bid.createdAt, locale)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {auction.plate.isVip && (
        <p className="flex items-center gap-1.5 text-xs text-(--color-gold)">
          <Crown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
          {t("auction.vipBadge")}
        </p>
      )}
    </div>
  );
}
