"use client";

import { useEffect, useRef, useState } from "react";
import { acquireSocket, releaseSocket, createEventDeduper } from "@/lib/realtimeClient";
import type { AuctionSocketEvent, AuctionPresenceEvent } from "@/lib/realtimeEvents";

export type { AuctionSocketEvent, AuctionSnapshot, AuctionPresenceEvent } from "@/lib/realtimeEvents";

/**
 * Joins the given auction's realtime room and invokes onEvent for every
 * server-pushed update.
 *
 * - Shares the tab's single socket (see realtimeClient) rather than
 *   opening one per mounted component.
 * - Rejoins the room on reconnect, and fires onResync so the caller can
 *   re-read authoritative state for whatever it missed while offline.
 * - Drops repeat deliveries by event id, so a redelivered bid never
 *   double-counts.
 * - Optionally reports live viewer presence via onPresence — kept in this
 *   one hook (the single realtime entry point for an auction page) rather
 *   than a second parallel socket subscription.
 */
export function useAuctionSocket(
  auctionId: string,
  onEvent: (event: AuctionSocketEvent) => void,
  onResync?: () => void,
  onPresence?: (count: number) => void
) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  const onResyncRef = useRef(onResync);
  const onPresenceRef = useRef(onPresence);

  useEffect(() => {
    onEventRef.current = onEvent;
    onResyncRef.current = onResync;
    onPresenceRef.current = onPresence;
  }, [onEvent, onResync, onPresence]);

  useEffect(() => {
    if (!auctionId) return;

    const socket = acquireSocket();
    const dedupe = createEventDeduper();
    // A first "connect" is the initial join, not a recovery — only a
    // later one means events may have been missed in between.
    let hasConnectedBefore = false;
    let active = true;

    const join = () => socket.emit("auction:join", auctionId);

    const handleConnect = () => {
      setConnected(true);
      join();
      if (hasConnectedBefore) onResyncRef.current?.();
      hasConnectedBefore = true;
    };
    const handleDisconnect = () => setConnected(false);
    const handleEvent = (event: AuctionSocketEvent) => {
      if (event.auctionId !== auctionId) return;
      if (!dedupe.accept(event.eventId)) return;
      onEventRef.current(event);
    };
    const handlePresence = (event: AuctionPresenceEvent) => {
      if (event.auctionId !== auctionId) return;
      onPresenceRef.current?.(event.count);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("auction:event", handleEvent);
    socket.on("auction:presence", handlePresence);

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
      socket.emit("auction:leave", auctionId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("auction:event", handleEvent);
      socket.off("auction:presence", handlePresence);
      releaseSocket();
    };
  }, [auctionId]);

  return { connected };
}
