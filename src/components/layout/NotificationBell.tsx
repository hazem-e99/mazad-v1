"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api-client";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { formatDateTime } from "@/lib/format";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Structurally mirrors Header's account dropdown (relative wrapper, toggle
 * button, fixed click-away layer, absolute end-0 top-full panel) so the
 * two dropdowns feel like the same design system, not two.
 */
export function NotificationBell({ overHero }: { overHero: boolean }) {
  const { t, locale } = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  const refreshUnreadCount = useCallback(() => {
    apiFetch<{ count: number }>("/api/notifications/unread-count", { silentErrors: true })
      .then((data) => setUnread(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const reset = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(reset);
  }, [pathname]);

  const handleEvent = useCallback(() => {
    setUnread((n) => n + 1);
  }, []);

  useNotificationSocket(handleEvent, refreshUnreadCount);

  function loadList() {
    apiFetch<{ items: NotificationItem[] }>("/api/notifications?limit=8", { silentErrors: true })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next) loadList();
      return next;
    });
  }

  function markAllRead() {
    apiFetch("/api/notifications/read-all", { method: "PATCH", silentErrors: true })
      .then(() => {
        setUnread(0);
        setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
      })
      .catch(() => {});
  }

  function markRead(id: string) {
    setItems((prev) => prev?.map((n) => (n._id === id ? { ...n, read: true } : n)) ?? null);
    setUnread((n) => Math.max(0, n - 1));
    apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", silentErrors: true }).catch(() => {});
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("notifications.title")}
        onClick={toggle}
        className={cn("relative px-2.5", overHero && "border-white/55 bg-black/18 text-white hover:bg-black/28")}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute end-0 top-full z-20 mt-3 w-80 max-w-[90vw] overflow-hidden rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) shadow-(--shadow-elevated)"
          >
            <div className="flex items-center justify-between gap-2 border-b border-(--color-border) px-3.5 py-2.5">
              <span className="text-sm font-semibold text-(--color-text)">{t("notifications.title")}</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-(--color-gold) hover:text-(--color-gold-hover)"
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items === null ? (
                <div className="p-4 text-center text-xs text-(--color-text-faint)">…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-sm text-(--color-text-faint)">{t("notifications.empty")}</div>
              ) : (
                items.map((n) => {
                  const content = (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-(--color-text)">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-gold)" aria-hidden="true" />}
                      </div>
                      {n.body && <p className="text-xs text-(--color-text-muted)">{n.body}</p>}
                      <span className="tnum text-[11px] text-(--color-text-faint)">{formatDateTime(n.createdAt, locale)}</span>
                    </div>
                  );

                  const className = cn(
                    "block w-full border-b border-(--color-border) px-3.5 py-3 text-start transition-colors last:border-b-0 hover:bg-(--color-surface-hover)",
                    !n.read && "bg-(--color-gold-tint)/40"
                  );

                  return n.link ? (
                    <Link key={n._id} href={n.link} role="menuitem" className={className} onClick={() => markRead(n._id)}>
                      {content}
                    </Link>
                  ) : (
                    <button key={n._id} type="button" role="menuitem" className={className} onClick={() => markRead(n._id)}>
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
