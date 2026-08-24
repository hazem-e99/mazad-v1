"use client";

import { useEffect, useRef } from "react";
import { acquireSocket, releaseSocket, createEventDeduper } from "@/lib/realtimeClient";
import type { UserNotificationEvent } from "@/lib/realtimeEvents";

export type { UserNotificationEvent } from "@/lib/realtimeEvents";

/**
 * Listens for realtime notification pushes on the tab's shared socket.
 * Unlike useAuctionSocket there is no explicit room to join — every
 * authenticated connection auto-joins its own user room server-side (see
 * server/index.ts) — so this only needs to attach listeners.
 *
 * onResync fires on a *re*-connect (not the first connect) so the caller
 * can refetch the authoritative unread count for whatever was missed
 * while offline, mirroring useAuctionSocket's resync contract.
 */
export function useNotificationSocket(onEvent: (event: UserNotificationEvent) => void, onResync?: () => void) {
  const onEventRef = useRef(onEvent);
  const onResyncRef = useRef(onResync);

  useEffect(() => {
    onEventRef.current = onEvent;
    onResyncRef.current = onResync;
  }, [onEvent, onResync]);

  useEffect(() => {
    const socket = acquireSocket();
    const dedupe = createEventDeduper();
    let hasConnectedBefore = false;

    const handleConnect = () => {
      if (hasConnectedBefore) onResyncRef.current?.();
      hasConnectedBefore = true;
    };
    const handleEvent = (event: UserNotificationEvent) => {
      if (!dedupe.accept(event.id)) return;
      onEventRef.current(event);
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleEvent);

    if (socket.connected) hasConnectedBefore = true;

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleEvent);
      releaseSocket();
    };
  }, []);
}
