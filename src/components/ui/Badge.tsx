import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type Tone =
  | "live"
  | "scheduled"
  | "sold"
  | "unsold"
  | "vip"
  | "neutral"
  | "gold"
  | "success"
  | "danger"
  | "info";

const toneClasses: Record<Tone, string> = {
  live: "bg-(--color-live-bg) text-(--color-live) border-(--color-live)/25",
  scheduled: "bg-(--color-scheduled-bg) text-(--color-scheduled) border-(--color-scheduled)/25",
  sold: "bg-(--color-sold-bg) text-(--color-sold) border-(--color-sold)/25",
  success: "bg-(--color-sold-bg) text-(--color-sold) border-(--color-sold)/25",
  danger: "bg-(--color-danger)/12 text-(--color-danger) border-(--color-danger)/25",
  info: "bg-(--color-info)/12 text-(--color-info) border-(--color-info)/25",
  unsold: "bg-(--color-unsold-bg) text-(--color-text-muted) border-(--color-border)",
  neutral: "bg-(--color-unsold-bg) text-(--color-text-muted) border-(--color-border)",
  vip: "bg-(--color-vip-bg) text-(--color-gold) border-(--color-gold)/35",
  gold: "bg-(--color-gold) text-(--color-gold-foreground) border-transparent font-semibold",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-(--radius-sm) border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {tone === "live" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
