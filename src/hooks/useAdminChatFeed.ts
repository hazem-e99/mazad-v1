"use client";

import { useEffect, useState } from "react";
import { acquireSocket, releaseSocket, createEventDeduper } from "@/lib/realtimeClient";

export interface LiveChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
}

/**
 * Subscribes to the chat's two broadcast events on the dashboard's shared
 * socket (see realtimeClient.ts) — no room join needed, since both
 * `chat:message` and `chat:message_deleted` are already plain `io.emit`s
 * reaching every connected socket, admin or not.
 *
 * Returns the live tail of new messages plus every id seen deleted live,
 * so a consumer can merge both against its server-rendered initial list:
 * `[...serverRows, ...messages].filter(m => !deletedIds.has(m.id))`.
 * Deletions are tracked separately from `messages` rather than only
 * filtering this hook's own list, because a message that arrived in the
 * *server-rendered* initial page load (before this hook ever mounted)
 * still needs to disappear live when deleted.
 */
export function useAdminChatFeed(historyLimit = 30) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const socket = acquireSocket();
    const dedupe = createEventDeduper();

    const handleNew = (msg: LiveChatMessage) => {
      if (!dedupe.accept(msg.id)) return;
      setMessages((prev) => [msg, ...prev].slice(0, historyLimit));
    };
    const handleDeleted = ({ id }: { id: string }) => {
      setDeletedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    socket.on("chat:message", handleNew);
    socket.on("chat:message_deleted", handleDeleted);

    return () => {
      socket.off("chat:message", handleNew);
      socket.off("chat:message_deleted", handleDeleted);
      releaseSocket();
    };
  }, [historyLimit]);

  return { messages, deletedIds };
}
