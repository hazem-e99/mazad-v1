import type { Server as IOServer } from "socket.io";
import {
  auctionRoom,
  ADMIN_AUCTION_ROOM,
  type AuctionSocketEvent,
  type AdminEventExtras,
} from "@/lib/realtimeEvents";

// The event contract lives in realtimeEvents.ts so browsers can import it
// without dragging socket.io's server types along; re-exported here for
// server-side callers that already import from this module.
export * from "@/lib/realtimeEvents";

declare global {
  var __io: IOServer | undefined;
}

export function setIO(io: IOServer) {
  global.__io = io;
}

export function getIO(): IOServer | undefined {
  return global.__io;
}

/**
 * Fans one state change out to the auction's public room and to the staff
 * room. Both carry the identical snapshot; only the admin copy carries the
 * `admin` extras, so contact details never reach a public subscriber.
 */
export function emitAuctionEvent(event: AuctionSocketEvent, adminExtras: AdminEventExtras = {}) {
  const io = getIO();
  if (!io) return;
  io.to(auctionRoom(event.auctionId)).emit("auction:event", event);
  io.to(ADMIN_AUCTION_ROOM).emit("admin:auction_event", { ...event, admin: adminExtras });
}
