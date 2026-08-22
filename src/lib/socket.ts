import type { Server as IOServer } from "socket.io";

declare global {
  var __io: IOServer | undefined;
}

export function setIO(io: IOServer) {
  global.__io = io;
}

export function getIO(): IOServer | undefined {
  return global.__io;
}

export function auctionRoom(auctionId: string) {
  return `auction:${auctionId}`;
}

// Emitted server -> room whenever an auction's state changes.
export type AuctionSocketEvent =
  | { type: "bid_accepted"; auctionId: string; amount: number; bidderId: string; bidderName: string; endAt: string }
  | { type: "auction_started"; auctionId: string }
  | { type: "auction_ending_soon"; auctionId: string; endAt: string }
  | { type: "auction_ended"; auctionId: string }
  | { type: "auction_finalized"; auctionId: string; status: string; winnerId?: string; finalPrice?: number }
  | { type: "direct_purchase"; auctionId: string; buyerId: string; price: number };

export function emitAuctionEvent(event: AuctionSocketEvent) {
  const io = getIO();
  if (!io) return;
  io.to(auctionRoom(event.auctionId)).emit("auction:event", event);
}
