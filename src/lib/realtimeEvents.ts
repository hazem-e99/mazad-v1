import type { AuctionStatus } from "@/lib/constants";

/**
 * Wire format shared by the server emitter and every browser
 * subscriber. Deliberately free of any `socket.io` import: this module
 * is reachable from client components, and pulling the server’s
 * generic Server/Socket types into that graph is both wrong and
 * ruinously expensive to typecheck.
 */

export function auctionRoom(auctionId: string) {
  return `auction:${auctionId}`;
}

/**
 * One global room every staff dashboard joins, so an admin watching the
 * auctions table or the overview sees a bid on *any* auction without
 * having to subscribe to each auction room individually. Membership is
 * permission-gated at join time (see server/index.ts) — the payloads sent
 * here carry bidder contact details the public rooms never receive.
 */
export const ADMIN_AUCTION_ROOM = "admin:auctions";

/**
 * The authoritative post-write state of an auction, read back from the
 * document the conditional update returned — never assembled from what
 * the client sent. Every realtime consumer (public panel, admin table,
 * admin detail) renders from this same snapshot, so a price shown to an
 * admin can never disagree with the price shown to a bidder.
 */
export interface AuctionSnapshot {
  auctionId: string;
  status: AuctionStatus;
  currentPrice: number;
  minIncrement: number;
  bidCount: number;
  startAt: string;
  endAt: string;
  highestBidderId: string | null;
  highestBidderName: string | null;
  finalPrice: number | null;
  winnerId: string | null;
  winnerName: string | null;
  /** Optimistic-concurrency token from the auction document. Consumers drop
   * any event whose version is older than what they already applied, so a
   * reordered or replayed delivery can never roll a price backwards. */
  version: number;
}

interface BaseEvent {
  /** Unique per emit — lets clients discard a duplicate delivery (e.g. a
   * reconnect that replays, or a component mounted twice). */
  eventId: string;
  auctionId: string;
  snapshot: AuctionSnapshot;
}

// Emitted server -> room whenever an auction's state changes.
export type AuctionSocketEvent =
  | (BaseEvent & {
      type: "bid_accepted";
      bidId: string;
      amount: number;
      bidderId: string;
      bidderName: string;
      createdAt: string;
      endAt: string;
    })
  | (BaseEvent & { type: "auction_started" })
  | (BaseEvent & { type: "auction_ending_soon"; endAt: string })
  | (BaseEvent & { type: "auction_ended" })
  | (BaseEvent & { type: "auction_finalized"; status: string; winnerId?: string; finalPrice?: number })
  | (BaseEvent & { type: "direct_purchase"; buyerId: string; price: number });

/** Extra fields only staff may see, merged into the admin-room payload. */
export interface AdminEventExtras {
  bidderPhone?: string | null;
  plateLabel?: string | null;
}

export type AdminAuctionSocketEvent = AuctionSocketEvent & { admin: AdminEventExtras };

export function newEventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
