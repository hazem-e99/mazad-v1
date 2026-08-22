"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface CountdownTimerProps {
  endAt: string;
  serverNowOffsetMs?: number;
  onExpire?: () => void;
  className?: string;
  /** Tints the digits as time runs low. Off by default so compact contexts
   * (auction cards) stay quiet; the detail page's primary countdown opts in. */
  urgency?: boolean;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { d, h, m, s, expired: false };
}

/**
 * Displays a locally-smoothed countdown but treats the server's `endAt`
 * (and any realtime correction via a re-render with a new endAt prop) as
 * the sole source of truth — the backend independently decides whether
 * the auction is actually open when a bid/purchase request lands.
 */
export function CountdownTimer({ endAt, serverNowOffsetMs = 0, onExpire, className, urgency = false }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now() + serverNowOffsetMs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + serverNowOffsetMs), 1000);
    return () => clearInterval(id);
  }, [serverNowOffsetMs]);

  const remainingMs = new Date(endAt).getTime() - now;
  const { d, h, m, s, expired } = formatRemaining(remainingMs);

  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const isCritical = urgency && !expired && remainingMs <= 60_000;
  const isUrgent = urgency && !expired && !isCritical && remainingMs <= 5 * 60_000;

  return (
    <div
      // The urgency colors use the `!` important modifier: `className` may
      // already carry its own `text-*` utility for the non-urgent state
      // (equal specificity, same-selector Tailwind classes), and the one
      // that wins the cascade is whichever Tailwind happened to generate
      // later in the stylesheet — not simply the last one in this list.
      className={cn(className, isCritical && "text-(--color-live)! animate-pulse", isUrgent && "text-(--color-warning)!")}
      role="timer"
      aria-live="off"
      // The countdown's remaining-time text is, by definition, computed from
      // wall-clock "now" — it legitimately differs between the server's
      // render instant and the client's hydration instant a moment later.
      // This is React's documented pattern for exactly that case: without
      // it, every mount logs a hydration-mismatch error and React discards
      // and rebuilds the subtree client-side, which is what was tearing
      // down (and delaying the rejoin of) the auction's live socket room.
      suppressHydrationWarning
    >
      <span className="sr-only" suppressHydrationWarning>
        {expired ? "انتهى المزاد" : `الوقت المتبقي ${d} أيام ${h} ساعات ${m} دقائق ${s} ثواني`}
      </span>
      <span aria-hidden="true" className="tnum font-mono" suppressHydrationWarning>
        {expired ? "انتهى" : d > 0 ? `${d}ي ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </span>
    </div>
  );
}
