import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "live" | "scheduled" | "sold" | "unsold" | "vip" | "neutral" | "gold";

const toneClasses: Record<Tone, string> = {
  live: "bg-(--color-live-bg) text-(--color-live)",
  scheduled: "bg-(--color-scheduled-bg) text-(--color-scheduled)",
  sold: "bg-(--color-sold-bg) text-(--color-sold)",
  unsold: "bg-(--color-surface-hover) text-(--color-text-muted)",
  vip: "bg-(--color-vip-bg) text-(--color-gold) border border-(--color-gold)/30",
  neutral: "bg-(--color-surface-hover) text-(--color-text-muted)",
  gold: "bg-(--color-gold) text-(--color-gold-foreground)",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", tone === "live" && "animate-pulse")}
          style={{ background: "currentColor" }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
