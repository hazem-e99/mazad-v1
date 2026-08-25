"use client";

import { useMemo } from "react";
import { MessageSquareWarning } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatDateTime } from "@/lib/format";
import { useAdminChatFeed } from "@/hooks/useAdminChatFeed";
import { DeleteChatMessageButton } from "./ChatMessageRowActions";
import { BlockUserButton } from "./BlockUserButton";
import type { ChatMessageDTO } from "@/types/dto";

/**
 * The server-rendered `initial` list is what paints on first byte; the
 * live feed (new arrivals + deletions, same socket the public /chat page
 * itself uses) is merged over it on every update after that, so this
 * table never needs a manual refresh to reflect what moderators do to
 * each other's screens or what users are sending right now.
 */
export function LiveChatMessagesFeed({
  initial,
  blockedByUser,
}: {
  initial: ChatMessageDTO[];
  blockedByUser: Record<string, boolean>;
}) {
  const { t, locale } = useTranslations();
  const { messages: liveMessages, deletedIds } = useAdminChatFeed();

  const merged = useMemo(() => {
    const byId = new Map<string, { id: string; text: string; userId: string; userName: string; createdAt: string }>();
    for (const m of initial) {
      byId.set(m._id, { id: m._id, text: m.text, userId: m.user._id, userName: m.user.name, createdAt: m.createdAt });
    }
    for (const m of liveMessages) {
      byId.set(m.id, m);
    }
    for (const id of deletedIds) byId.delete(id);

    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [initial, liveMessages, deletedIds]);

  if (merged.length === 0) {
    return (
      <div className="p-5">
        <EmptyState icon={MessageSquareWarning} title={t("admin.noChatMessagesYet")} />
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-(--color-border)" aria-live="polite">
      {merged.map((message) => (
        <li key={message.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-(--color-text)">{message.userName}</p>
            <p className="text-(--color-text-muted) break-words">{message.text}</p>
            <p className="text-[11px] text-(--color-text-faint)">{formatDateTime(message.createdAt, locale)}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <DeleteChatMessageButton messageId={message.id} />
            {message.userId && <BlockUserButton userId={message.userId} isBlocked={blockedByUser[message.userId] ?? false} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
