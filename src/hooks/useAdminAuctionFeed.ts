"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { acquireSocket, releaseSocket, createEventDeduper } from "@/lib/realtimeClient";
import type { AdminAuctionSocketEvent, AuctionSnapshot } from "@/lib/realtimeEvents";

export type { AuctionSnapshot } from "@/lib/realtimeEvents";

export interface AdminLiveBid {
  /** The Bid document's id — stable across redeliveries, so React keys
   * never collide and the same bid cannot appear twice in the list. */
  id: string;
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  bidderPhone: string | null;
  plateLabel: string | null;
  createdAt: string;
}

export type AdminFeedStatus = "connecting" | "live" | "offline" | "unauthorized";

/** How long to wait for the server to acknowledge the room join before
 * treating the feed as down. */
const JOIN_ACK_TIMEOUT_MS = 5000;
const JOIN_RETRY_MS = 3000;

interface Options {
  /** Re-pull server-rendered data after a reconnect, so anything that
   * happened while the socket was down is picked up from the database
   * rather than being silently missing. Defaults to router.refresh(). */
  onResync?: () => void;
  /** How many recent bids to retain for the activity feed. */
  historyLimit?: number;
}

/**
 * Subscribes the current staff page to the global auction feed.
 *
 * Returns a map of auctionId -> latest committed snapshot. Callers render
 * `live.get(id) ?? serverRenderedRow`, so the page paints correct data on
 * first byte and then tracks the database without a reload.
 */
export function useAdminAuctionFeed(options: Options = {}) {
  const { historyLimit = 30 } = options;
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Map<string, AuctionSnapshot>>(() => new Map());
  const [recentBids, setRecentBids] = useState<AdminLiveBid[]>([]);
  const [status, setStatus] = useState<AdminFeedStatus>("connecting");
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

  const onResyncRef = useRef(options.onResync);
  useEffect(() => {
    onResyncRef.current = options.onResync;
  }, [options.onResync]);

  useEffect(() => {
    const socket = acquireSocket();
    const dedupe = createEventDeduper();
    let hasJoinedBefore = false;
    let disposed = false;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const join = () => {
      // socket.timeout() makes a missing/stale server handler observable:
      // without it a server running older code simply never acks and the
      // dashboard shows "connecting" indefinitely.
      socket
        .timeout(JOIN_ACK_TIMEOUT_MS)
        .emit("admin:join", (timeoutError: Error | null, result?: { ok: boolean }) => {
          if (disposed) return;

          if (timeoutError) {
            setStatus("offline");
            retryTimer = setTimeout(join, JOIN_RETRY_MS);
            return;
          }
          if (!result?.ok) {
            setStatus("unauthorized");
            return;
          }

          setStatus("live");
          if (hasJoinedBefore) {
            // Reconnected: the database is the source of truth for
            // whatever was missed, so re-read rather than guessing from
            // local state.
            (onResyncRef.current ?? (() => router.refresh()))();
          }
          hasJoinedBefore = true;
        });
    };

    const handleConnect = () => join();
    const handleDisconnect = () => setStatus((prev) => (prev === "unauthorized" ? prev : "offline"));

    const handleEvent = (event: AdminAuctionSocketEvent) => {
      if (!dedupe.accept(event.eventId)) return;
      const snapshot = event.snapshot;
      if (!snapshot) return;

      setSnapshots((prev) => {
        const existing = prev.get(snapshot.auctionId);
        // Version guard: a delayed or reordered delivery must never undo
        // a newer state the dashboard has already applied.
        if (existing && existing.version > snapshot.version) return prev;
        const next = new Map(prev);
        next.set(snapshot.auctionId, snapshot);
        return next;
      });
      setLastEventAt(Date.now());

      if (event.type === "bid_accepted") {
        setRecentBids((prev) => {
          if (prev.some((b) => b.id === event.bidId)) return prev;
          const entry: AdminLiveBid = {
            id: event.bidId,
            auctionId: event.auctionId,
            amount: event.amount,
            bidderId: event.bidderId,
            bidderName: event.bidderName,
            bidderPhone: event.admin?.bidderPhone ?? null,
            plateLabel: event.admin?.plateLabel ?? null,
            createdAt: event.createdAt,
          };
          return [entry, ...prev].slice(0, historyLimit);
        });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("admin:auction_event", handleEvent);

    if (socket.connected) join();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket.emit("admin:leave");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("admin:auction_event", handleEvent);
      releaseSocket();
    };
  }, [historyLimit, router]);

  /** Snapshot for one auction, or undefined if it hasn't moved yet. */
  const snapshotFor = useCallback((auctionId: string) => snapshots.get(auctionId), [snapshots]);

  return { snapshots, snapshotFor, recentBids, status, lastEventAt };
}
