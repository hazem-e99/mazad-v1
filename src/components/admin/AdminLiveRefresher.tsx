"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminRealtime } from "@/components/admin/AdminRealtimeProvider";

/**
 * Per-auction values (price, bid count, highest bidder, status) arrive
 * complete in the socket snapshot and are rendered directly. Aggregates —
 * dashboard counters, the paginated bids table, audit rows — cannot be
 * derived from a single event without the client inventing numbers, so
 * this instead re-runs the server components against the database.
 *
 * router.refresh() re-renders on the server and streams the result into
 * the existing tree: no page reload, no lost scroll position, and every
 * number still comes from the database rather than local arithmetic.
 *
 * Debounced so a burst of bids costs one query, not one per bid.
 */
export function AdminLiveRefresher({ debounceMs = 1200 }: { debounceMs?: number }) {
  const { lastEventAt } = useAdminRealtime();
  const router = useRouter();

  useEffect(() => {
    if (!lastEventAt) return;
    const id = setTimeout(() => router.refresh(), debounceMs);
    return () => clearTimeout(id);
  }, [lastEventAt, debounceMs, router]);

  return null;
}
