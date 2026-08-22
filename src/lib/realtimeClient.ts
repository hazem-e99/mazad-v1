"use client";

import { io, type Socket } from "socket.io-client";

/**
 * One Socket.IO connection per browser tab, shared by every subscriber
 * (bid panel, chat, admin dashboard). Without this each hook opened its
 * own socket, so a page mounting two auction-aware components held two
 * connections and received — and rendered — every event twice.
 *
 * Subscribers acquire/release rather than connect/disconnect; the socket
 * is torn down only once the last one lets go.
 */
let socket: Socket | null = null;
let refCount = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;

/** React StrictMode mounts effects twice in dev (mount → unmount → mount).
 * Deferring teardown briefly lets the remount reuse the live socket
 * instead of tearing down and reconnecting on every navigation. */
const TEARDOWN_GRACE_MS = 1500;

export function acquireSocket(): Socket {
  if (teardownTimer) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }
  if (!socket) {
    socket = io({
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
  }
  refCount += 1;
  return socket;
}

export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !socket) return;

  const pending = socket;
  teardownTimer = setTimeout(() => {
    teardownTimer = null;
    // A subscriber may have re-acquired during the grace window.
    if (refCount > 0) return;
    pending.removeAllListeners();
    pending.disconnect();
    if (socket === pending) socket = null;
  }, TEARDOWN_GRACE_MS);
}

/** Test/debug aid — how many subscribers currently hold the socket. */
export function socketRefCount() {
  return refCount;
}

/**
 * Bounded set of already-handled event ids. Socket.IO can redeliver on a
 * flaky reconnect, and a component that re-subscribes mid-flight could
 * otherwise apply the same bid twice (double-incrementing bid counts and
 * duplicating history rows).
 */
export function createEventDeduper(capacity = 400) {
  const seen = new Set<string>();
  const order: string[] = [];
  return {
    /** true if this id is new (and should be processed). */
    accept(id: string | undefined): boolean {
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      order.push(id);
      if (order.length > capacity) {
        const evicted = order.shift();
        if (evicted) seen.delete(evicted);
      }
      return true;
    },
  };
}
