"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface CountdownTimerProps {
  endAt: string;
  serverNowOffsetMs?: number;
  onExpire?: () => void;
  className?: string;
  /** Tints the digits as time runs low. Off by default so compact contexts
   * (auction cards) stay quiet; the detail page's primary countdown opts in. */
  urgency?: boolean;
  /** "inline" is a single run of digits for cards and table cells;
   * "blocks" is the segmented hh/mm/ss presentation with unit labels used
   * on the hero and the auction detail panel. */
  variant?: "inline" | "blocks";
  size?: "sm" | "md" | "lg";
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

const pad = (n: number) => String(n).padStart(2, "0");

const blockSize = {
  sm: { box: "h-11 w-11 text-lg", label: "text-[10px]", sep: "text-base" },
  md: { box: "h-14 w-14 text-2xl", label: "text-[11px]", sep: "text-xl" },
  lg: { box: "h-16 w-16 text-3xl sm:h-18 sm:w-18 sm:text-4xl", label: "text-xs", sep: "text-2xl" },
};

/**
 * Displays a locally-smoothed countdown but treats the server's `endAt`
 * (and any realtime correction via a re-render with a new endAt prop) as
 * the sole source of truth — the backend independently decides whether
 * the auction is actually open when a bid/purchase request lands.
 */
export function CountdownTimer({
  endAt,
  serverNowOffsetMs = 0,
  onExpire,
  className,
  urgency = false,
  variant = "inline",
  size = "md",
}: CountdownTimerProps) {
  const { t } = useTranslations();
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

  const isCritical = urgency && !expired && remainingMs <= 60_000;
  const isUrgent = urgency && !expired && !isCritical && remainingMs <= 5 * 60_000;

  const srText = expired
    ? t("auction.auctionEnded")
    : t("auction.timeRemainingSr", { days: d, hours: h, minutes: m, seconds: s });

  if (variant === "blocks") {
    const sz = blockSize[size];
    // Days are folded into the hours slot so the segment count never
    // changes mid-auction — a countdown that grows a fourth box as it
    // crosses 24h makes the whole panel jump.
    const hours = d > 0 ? d * 24 + h : h;

    return (
      <div
        className={cn("flex items-start gap-1.5", className)}
        role="timer"
        aria-live="off"
        suppressHydrationWarning
      >
        <span className="sr-only" suppressHydrationWarning>
          {srText}
        </span>
        {expired ? (
          <span aria-hidden="true" className="text-sm font-semibold text-(--color-text-muted)">
            {t("auction.ended")}
          </span>
        ) : (
          <>
            <Segment value={pad(hours)} label={t("auction.unitHours")} sz={sz} critical={isCritical} urgent={isUrgent} />
            <Separator sz={sz} />
            <Segment value={pad(m)} label={t("auction.unitMinutes")} sz={sz} critical={isCritical} urgent={isUrgent} />
            <Separator sz={sz} />
            <Segment value={pad(s)} label={t("auction.unitSeconds")} sz={sz} critical={isCritical} urgent={isUrgent} />
          </>
        )}
      </div>
    );
  }

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
        {srText}
      </span>
      <span className="tnum font-mono" aria-hidden="true" suppressHydrationWarning>
        {expired ? t("auction.ended") : d > 0 ? `${d}${t("auction.dayShort")} ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </span>
    </div>
  );
}

function Segment({
  value,
  label,
  sz,
  critical,
  urgent,
}: {
  value: string;
  label: string;
  sz: (typeof blockSize)["md"];
  critical: boolean;
  urgent: boolean;
}) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span
        // Keyed on the value so React swaps the node each tick, letting the
        // digit fade in rather than mutating text in place.
        key={value}
        className={cn(
          "tnum flex items-center justify-center rounded-(--radius-md) border font-bold leading-none tabular-nums",
          "animate-rise-in bg-(--color-bg-elevated)",
          sz.box,
          critical
            ? "border-(--color-live)/40 text-(--color-live)"
            : urgent
              ? "border-(--color-warning)/40 text-(--color-warning)"
              : "border-(--color-border-strong) text-(--color-text)"
        )}
      >
        {value}
      </span>
      <span className={cn("font-medium text-(--color-text-faint)", sz.label)}>{label}</span>
    </span>
  );
}

function Separator({ sz }: { sz: (typeof blockSize)["md"] }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex items-center justify-center font-bold text-(--color-text-faint)", sz.box.split(" ")[0], sz.sep)}
    >
      :
    </span>
  );
}
