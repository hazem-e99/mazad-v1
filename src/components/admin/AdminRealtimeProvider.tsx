"use client";

import { createContext, useContext, useMemo } from "react";
import { useAdminAuctionFeed, type AdminFeedStatus, type AdminLiveBid, type AuctionSnapshot } from "@/hooks/useAdminAuctionFeed";

interface AdminRealtimeValue {
  snapshotFor: (auctionId: string) => AuctionSnapshot | undefined;
  recentBids: AdminLiveBid[];
  status: AdminFeedStatus;
  lastEventAt: number | null;
}

const fallback: AdminRealtimeValue = {
  snapshotFor: () => undefined,
  recentBids: [],
  status: "connecting",
  lastEventAt: null,
};

const AdminRealtimeContext = createContext<AdminRealtimeValue>(fallback);

/**
 * Mounted once in the /admin layout so every staff page shares a single
 * subscription and a single copy of the live state. Individual cells then
 * read from context instead of each opening their own feed.
 */
export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { snapshotFor, recentBids, status, lastEventAt } = useAdminAuctionFeed();

  const value = useMemo(
    () => ({ snapshotFor, recentBids, status, lastEventAt }),
    [snapshotFor, recentBids, status, lastEventAt]
  );

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>;
}

export function useAdminRealtime() {
  return useContext(AdminRealtimeContext);
}

/**
 * Merges the server-rendered row with whatever the live feed has since
 * delivered for that auction. The server value always wins on first paint
 * (nothing has arrived yet), so there is no flash of empty state.
 */
export function useLiveAuction<T extends { currentPrice: number }>(auctionId: string, initial: T) {
  const { snapshotFor } = useAdminRealtime();
  const snapshot = snapshotFor(auctionId);
  return { snapshot, isLive: Boolean(snapshot), initial };
}
