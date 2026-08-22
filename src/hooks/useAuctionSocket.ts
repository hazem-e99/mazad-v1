"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type AuctionSocketEvent =
  | { type: "bid_accepted"; auctionId: string; amount: number; bidderId: string; bidderName: string; endAt: string }
  | { type: "auction_started"; auctionId: string }
  | { type: "auction_ending_soon"; auctionId: string; endAt: string }
  | { type: "auction_ended"; auctionId: string }
  | { type: "auction_finalized"; auctionId: string; status: string; winnerId?: string; finalPrice?: number }
  | { type: "direct_purchase"; auctionId: string; buyerId: string; price: number };

/**
 * Joins the given auction's realtime room and invokes onEvent for every
 * server-pushed update. Handles reconnection automatically (rejoining the
 * room) since Socket.IO's default reconnection logic re-fires "connect".
 */
export function useAuctionSocket(auctionId: string, onEvent: (event: AuctionSocketEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const socket: Socket = io({ path: "/socket.io", withCredentials: true });

    const handleConnect = () => {
      setConnected(true);
      socket.emit("auction:join", auctionId);
    };
    const handleDisconnect = () => setConnected(false);
    const handleEvent = (event: AuctionSocketEvent) => onEventRef.current(event);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("auction:event", handleEvent);

    return () => {
      socket.emit("auction:leave", auctionId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("auction:event", handleEvent);
      socket.disconnect();
    };
  }, [auctionId]);

  return { connected };
}
