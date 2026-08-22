"use client";

import Link from "next/link";
import { Gavel, Radio } from "lucide-react";
import { useAdminRealtime } from "@/components/admin/AdminRealtimeProvider";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatSar, formatDateTime } from "@/lib/format";

/**
 * Bids as they land, pushed from the server the moment placeBid() commits.
 * Empty until the first event — this is a live tail, not a replacement for
 * the server-rendered history below it.
 */
export function LiveBidsFeed({ limit = 8 }: { limit?: number }) {
  const { recentBids } = useAdminRealtime();
  const { t, locale } = useTranslations();

  if (recentBids.length === 0) {
    return (
      <p className="flex items-center gap-2 px-5 py-6 text-sm text-(--color-text-faint)">
        <Radio className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
        {t("admin.awaitingLiveBids")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-(--color-border)" aria-live="polite">
      {recentBids.slice(0, limit).map((bid, i) => (
        <li
          key={bid.id}
          className={`flex items-center gap-3 px-4 py-3 text-sm ${i === 0 ? "animate-rise-in" : ""}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-gold-tint) text-(--color-gold)">
            <Gavel className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/auctions/${bid.auctionId}`}
              className="truncate font-medium text-(--color-text) hover:text-(--color-gold)"
            >
              {bid.plateLabel ?? t("common.plate")}
            </Link>
            <div className="truncate text-xs text-(--color-text-faint)">
              {bid.bidderName}
              {bid.bidderPhone && (
                <span className="tnum" dir="ltr">
                  {" · "}
                  {bid.bidderPhone}
                </span>
              )}
            </div>
          </div>
          <span className="tnum shrink-0 font-semibold text-(--color-gold)">{formatSar(bid.amount, locale)}</span>
          <span className="tnum hidden shrink-0 text-[11px] text-(--color-text-faint) sm:inline">
            {formatDateTime(bid.createdAt, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}
