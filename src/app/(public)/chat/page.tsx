"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDateTime } from "@/lib/format";
import { apiFetch } from "@/lib/api-client";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface ChatMessage {
  id?: string;
  _id?: string;
  text: string;
  userId?: string;
  userName?: string;
  user?: { name: string };
  createdAt: string;
}

export default function ChatPage() {
  const { t, locale } = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<ChatMessage[]>("/api/chat/messages").then(setMessages).catch(() => undefined);

    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("chat:error", (message: string) => setError(message));

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    socketRef.current?.emit("chat:message", text.trim());
    setText("");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-(--color-gold)" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-(--color-text)">{t("pages.chatTitle")}</h1>
      </div>
      <Card className="flex flex-col h-[65vh] overflow-hidden">
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageCircle} title={t("pages.noMessagesYet")} />
            </div>
          )}
          {messages.map((m, i) => {
            const name = m.userName ?? m.user?.name ?? "—";
            return (
              <div key={m.id ?? m._id ?? i} className="flex flex-col gap-0.5 max-w-[80%] items-start self-start">
                <p className="text-xs text-(--color-gold) font-medium px-1">{name}</p>
                <div className="rounded-(--radius-md) bg-(--color-bg-elevated) px-3 py-2">
                  <p className="text-sm text-(--color-text) whitespace-pre-wrap break-words">{m.text}</p>
                </div>
                <p className="text-[10px] text-(--color-text-faint) px-1">{formatDateTime(m.createdAt, locale)}</p>
              </div>
            );
          })}
        </div>
        <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-(--color-border) p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("pages.typeMessage")}
            maxLength={500}
            className="flex-1 h-11 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          />
          <Button type="submit" variant="gold" size="md" disabled={!text.trim()}>
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("pages.send")}</span>
          </Button>
        </form>
        {error && <p className="px-3 pb-2 text-xs text-(--color-danger)">{error}</p>}
      </Card>
    </div>
  );
}
