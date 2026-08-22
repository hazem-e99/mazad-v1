import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "live" | "gold" | "success" | "muted" | "info";

const valueTone: Record<Tone, string> = {
  neutral: "text-(--color-text)",
  live: "text-(--color-live)",
  gold: "text-(--color-gold)",
  success: "text-(--color-sold)",
  muted: "text-(--color-text-faint)",
  info: "text-(--color-info)",
};

const iconTone: Record<Tone, string> = {
  neutral: "bg-(--color-surface-hover) text-(--color-text-muted) border-(--color-border)",
  live: "bg-(--color-live-bg) text-(--color-live) border-(--color-live)/20",
  gold: "bg-(--color-gold-tint) text-(--color-gold) border-(--color-gold)/25",
  success: "bg-(--color-sold-bg) text-(--color-sold) border-(--color-sold)/20",
  muted: "bg-(--color-surface-hover) text-(--color-text-faint) border-(--color-border)",
  info: "bg-(--color-info)/12 text-(--color-info) border-(--color-info)/20",
};

/**
 * A dashboard metric. Only the figures that carry a state (live, sold,
 * VIP) take a colour — a wall of gold cards would rank everything equally
 * and so rank nothing.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  trend,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Percentage change vs. the previous period; sign drives the arrow. */
  trend?: number;
  hint?: string;
  className?: string;
}) {
  const TrendIcon = trend != null && trend < 0 ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5",
        "transition-colors duration-(--duration-base) hover:border-(--color-border-strong)",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="truncate text-xs font-medium text-(--color-text-muted)">{label}</span>
          <span className={cn("tnum text-2xl font-bold leading-none tracking-tight sm:text-[1.75rem]", valueTone[tone])}>
            {value}
          </span>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-md) border",
              iconTone[tone]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
          </span>
        )}
      </div>

      {(trend != null || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend != null && (
            <span
              className={cn(
                "tnum inline-flex items-center gap-1 font-semibold",
                trend < 0 ? "text-(--color-danger)" : "text-(--color-sold)"
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="truncate text-(--color-text-faint)">{hint}</span>}
        </div>
      )}
    </div>
  );
}
