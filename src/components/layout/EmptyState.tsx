import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * An empty result is a state, not a gap. Every list renders this rather
 * than collapsing to nothing, so the page keeps its shape and always
 * offers the next step.
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-(--radius-xl) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated)/50 px-6 py-16 text-center",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mz-glow-gold pointer-events-none absolute -top-20 start-1/2 h-48 w-96 -translate-x-1/2 opacity-40"
      />
      {Icon && (
        <span className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text-faint)">
          <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={1.5} />
        </span>
      )}
      <p className="relative text-base font-semibold text-(--color-text)">{title}</p>
      {description && <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-(--color-text-muted)">{description}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}
