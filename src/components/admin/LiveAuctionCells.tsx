"use client";

import { Wifi, WifiOff, ShieldAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { useAdminRealtime } from "@/components/admin/AdminRealtimeProvider";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatSar, formatDateTime } from "@/lib/format";
import { isFinalStatus } from "@/lib/auctionStatus";
import { cn } from "@/lib/cn";
import type { AuctionStatus } from "@/lib/constants";

/**
 * Each cell renders the server-rendered value until the live feed has
 * something newer for that auction. Keeping the realtime surface at cell
 * granularity means the surrounding table stays a server component — no
 * client-side re-fetch, no duplicated query, no loading skeleton.
 */

/** Brief highlight when a value actually changes, so an admin watching the
 * table notices the row that moved. Keyed on the value itself so React
 * remounts the span and replays the animation. */
function Pulse({ children, pulseKey, className }: { children: React.ReactNode; pulseKey: string | number; className?: string }) {
  return (
    <span key={pulseKey} className={cn("animate-value-pulse inline-block rounded-(--radius-sm)", className)}>
      {children}
    </span>
  );
}

export function LivePrice({
  auctionId,
  currentPrice,
  finalPrice,
  status,
  locale,
  className,
}: {
  auctionId: string;
  currentPrice: number;
  finalPrice?: number | null;
  status: AuctionStatus;
  locale: "ar" | "en";
  className?: string;
}) {
  const { snapshotFor } = useAdminRealtime();
  const snap = snapshotFor(auctionId);

  const effectiveStatus = (snap?.status ?? status) as AuctionStatus;
  const effectiveFinal = snap ? snap.finalPrice : finalPrice ?? null;
  const effectiveCurrent = snap?.currentPrice ?? currentPrice;
  const amount = isFinalStatus(effectiveStatus) && effectiveFinal != null ? effectiveFinal : effectiveCurrent;

  return (
    <Pulse pulseKey={amount} className={className}>
      <span className="tnum">{formatSar(amount, locale)}</span>
    </Pulse>
  );
}

export function LiveBidCount({ auctionId, bidCount }: { auctionId: string; bidCount: number }) {
  const { snapshotFor } = useAdminRealtime();
  const value = snapshotFor(auctionId)?.bidCount ?? bidCount;
  return (
    <Pulse pulseKey={value}>
      <span className="tnum">{value}</span>
    </Pulse>
  );
}

export function LiveHighestBidder({
  auctionId,
  name,
  fallback = "—",
}: {
  auctionId: string;
  name: string | null | undefined;
  fallback?: string;
}) {
  const { snapshotFor } = useAdminRealtime();
  const snap = snapshotFor(auctionId);
  // Only override once the feed has actually reported a bidder: a snapshot
  // from an event that predates any bid carries null, and blanking a name
  // the server already rendered would be a regression, not an update.
  const value = snap?.highestBidderName ?? name ?? null;
  return (
    <Pulse pulseKey={value ?? "none"}>
      <span>{value || fallback}</span>
    </Pulse>
  );
}

export function LiveStatusBadge({
  auctionId,
  status,
  className,
}: {
  auctionId: string;
  status: AuctionStatus;
  className?: string;
}) {
  const { snapshotFor } = useAdminRealtime();
  const value = (snapshotFor(auctionId)?.status ?? status) as AuctionStatus;
  return <AuctionStatusBadge status={value} className={className} />;
}

export function LiveEndAt({
  auctionId,
  endAt,
  locale,
  countdown = false,
}: {
  auctionId: string;
  endAt: string;
  locale: "ar" | "en";
  /** Show a ticking countdown instead of an absolute timestamp. */
  countdown?: boolean;
}) {
  const { snapshotFor } = useAdminRealtime();
  const snap = snapshotFor(auctionId);
  const value = snap?.endAt ?? endAt;
  const status = snap?.status;

  if (countdown && (status ? status === "live" : true)) {
    return <CountdownTimer endAt={value} variant="inline" size="sm" />;
  }
  return <span className="tnum">{formatDateTime(value, locale)}</span>;
}

/** Header pill reporting whether this dashboard is actually receiving
 * pushes — an admin must be able to tell "nothing is happening" apart
 * from "I am no longer connected". */
export function AdminRealtimeStatus({ className }: { className?: string }) {
  const { status } = useAdminRealtime();
  const { t } = useTranslations();

  if (status === "unauthorized") {
    return (
      <Badge tone="neutral" className={cn("gap-1.5", className)}>
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
        {t("admin.realtimeUnauthorized")}
      </Badge>
    );
  }

  if (status === "connecting") {
    return (
      <Badge tone="neutral" className={cn("gap-1.5", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" strokeWidth={1.75} />
        {t("admin.realtimeConnecting")}
      </Badge>
    );
  }

  if (status === "offline") {
    return (
      <Badge tone="danger" className={cn("gap-1.5", className)} role="status" aria-live="polite">
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
        {t("admin.realtimeOffline")}
      </Badge>
    );
  }

  return (
    <Badge tone="live" dot className={cn("gap-1.5", className)} role="status" aria-live="polite">
      <Wifi className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />
      {t("admin.realtimeLive")}
    </Badge>
  );
}
