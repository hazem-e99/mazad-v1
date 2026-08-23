"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { acquireSocket, releaseSocket, createEventDeduper } from "@/lib/realtimeClient";
import type { AuctionSocketEvent, AuctionSnapshot } from "@/lib/realtimeEvents";

export type { AuctionSnapshot } from "@/lib/realtimeEvents";

/**
 * Public counterpart to useAdminAuctionFeed: joins *several* auction rooms
 * at once and returns the latest committed snapshot per auction.
 *
 * useAuctionSocket covers the single-auction case (one detail page, one
 * room). A listing surface such as the home stage shows many auctions at
 * the same time, so it needs every one of their rooms — otherwise the
 * price on a card only ever moves when that card happens to be the one
 * the visitor opened.
 *
 * Two kinds of change arrive here and they are handled differently:
 *
 * - A price/bid change is applied locally from the event's snapshot, which
 *   is the authoritative post-write state read back from the document (see
 *   realtimeEvents.ts) — never a number the browser derived itself.
 * - A lifecycle change (an auction opening, ending, being bought) alters
 *   *which* auctions belong on the page, and that is a question only the
 *   database can answer. Those trigger `onMembershipChange`, whose default
 *   is router.refresh() — the same re-read the admin feed does.
 *
 * Callers should therefore render `snapshotFor(id) ?? serverRenderedValue`
 * so the first paint is correct and the page tracks the database from
 * there without a reload.
 */
export function useAuctionRooms(
  auctionIds: string[],
  options: { onMembershipChange?: () => void } = {}
) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Map<string, AuctionSnapshot>>(() => new Map());
  const [connected, setConnected] = useState(false);

  const onMembershipChangeRef = useRef(options.onMembershipChange);
  useEffect(() => {
    onMembershipChangeRef.current = options.onMembershipChange;
  }, [options.onMembershipChange]);

  // Join/leave keyed by the *contents* of the id list, not its identity —
  // a parent re-render producing an equal-but-new array must not tear the
  // rooms down and rebuild them.
  const roomKey = auctionIds.join(",");

  useEffect(() => {
    const ids = roomKey ? roomKey.split(",") : [];
    if (ids.length === 0) return;

    const socket = acquireSocket();
    const dedupe = createEventDeduper();
    const watched = new Set(ids);
    // The first "connect" is the initial join; only a later one means
    // events may have been missed while the socket was down.
    let hasConnectedBefore = false;
    let active = true;

    const join = () => ids.forEach((id) => socket.emit("auction:join", id));

    const handleConnect = () => {
      setConnected(true);
      join();
      if (hasConnectedBefore) (onMembershipChangeRef.current ?? (() => router.refresh()))();
      hasConnectedBefore = true;
    };

    const handleDisconnect = () => setConnected(false);

    const handleEvent = (event: AuctionSocketEvent) => {
      if (!watched.has(event.auctionId)) return;
      if (!dedupe.accept(event.eventId)) return;

      const snapshot = event.snapshot;
      if (snapshot) {
        setSnapshots((prev) => {
          const existing = prev.get(snapshot.auctionId);
          // Version guard: a delayed or reordered delivery must never roll
          // a price backwards over newer state already applied.
          if (existing && existing.version > snapshot.version) return prev;
          const next = new Map(prev);
          next.set(snapshot.auctionId, snapshot);
          return next;
        });
      }

      if (
        event.type === "auction_started" ||
        event.type === "auction_ended" ||
        event.type === "auction_finalized" ||
        event.type === "direct_purchase"
      ) {
        (onMembershipChangeRef.current ?? (() => router.refresh()))();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("auction:event", handleEvent);

    // The shared socket may already be connected when this mounts, in
    // which case "connect" has fired and will not fire again.
    if (socket.connected) {
      queueMicrotask(() => {
        if (!active || !socket.connected) return;
        setConnected(true);
        hasConnectedBefore = true;
        join();
      });
    }

    return () => {
      active = false;
      ids.forEach((id) => socket.emit("auction:leave", id));
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("auction:event", handleEvent);
      releaseSocket();
    };
  }, [roomKey, router]);

  const snapshotFor = useCallback((auctionId: string) => snapshots.get(auctionId), [snapshots]);

  return { snapshots, snapshotFor, connected };
}
