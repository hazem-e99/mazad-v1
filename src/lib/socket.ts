import type { Server as IOServer } from "socket.io";
import {
  auctionRoom,
  ADMIN_AUCTION_ROOM,
  userRoom,
  type AuctionSocketEvent,
  type AdminEventExtras,
  type UserNotificationEvent,
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

/** Pushes one notification to exactly the user it belongs to — mirrors
 * emitAuctionEvent's shape but targets a single per-user room instead of
 * an auction/admin room. */
export function emitUserNotification(userId: string, payload: UserNotificationEvent) {
  const io = getIO();
  if (!io) return;
  io.to(userRoom(userId)).emit("notification:new", payload);
}

/**
 * Tells every connected chat client a message was removed by a moderator,
 * so it disappears live rather than only after the next page load. Called
 * from the (HTTP, not socket) message-delete route — `getIO()` reaches the
 * same server instance set up in server/index.ts since both run in the
 * one Node process.
 */
export function emitChatMessageDeleted(messageId: string) {
  const io = getIO();
  if (!io) return;
  io.emit("chat:message_deleted", { id: messageId });
}

/** Tells every connected chat client the whole room was wiped by an admin
 * — see emitChatMessageDeleted for the same "why HTTP can reach the
 * socket" reasoning. */
export function emitChatCleared() {
  const io = getIO();
  if (!io) return;
  io.emit("chat:cleared");
}
