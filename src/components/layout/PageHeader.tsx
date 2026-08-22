import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  eyebrow?: string;
  actions?: ReactNode;
  /** Adds the gold atmosphere reserved for the VIP and exclusive
   * landings. Ordinary listing pages stay quiet. */
  premium?: boolean;
  /** Rendered under the copy — count chips, filter summaries. */
  children?: ReactNode;
  className?: string;
}

/**
 * The banner every non-home page opens with. Centralising it is what
 * keeps `/auctions`, `/vip` and the ten admin screens on the same
 * vertical rhythm instead of each inventing its own heading block.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  eyebrow,
  actions,
  premium,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden",
        premium
          ? "mz-edge-gold rounded-(--radius-xl) border border-(--color-vip-border) bg-(--color-vip-surface) px-6 py-9 shadow-(--shadow-gold-glow) sm:px-10 sm:py-11"
          : "border-b border-(--color-border) pb-6",
        className
      )}
    >
      {premium && (
        <span
          aria-hidden="true"
          className="mz-glow-gold pointer-events-none absolute -top-24 start-1/2 h-64 w-[36rem] -translate-x-1/2"
        />
      )}

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className={cn("min-w-0", premium && "mx-auto max-w-2xl text-center")}>
          {eyebrow && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-(--color-gold)/25 bg-(--color-gold-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-gold)">
              {eyebrow}
            </span>
          )}

          {Icon && premium && (
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-(--color-gold)/30 bg-(--color-gold-tint) text-(--color-gold)">
              <Icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.5} />
            </span>
          )}

          <h1
            className={cn(
              "flex items-center gap-3 font-bold tracking-tight text-(--color-text)",
              premium ? "justify-center text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            )}
          >
            {Icon && !premium && (
              <Icon className="h-7 w-7 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
            )}
            {title}
          </h1>

          {subtitle && (
            <p className={cn("mt-2 text-(--color-text-muted)", premium ? "text-base" : "text-sm")}>{subtitle}</p>
          )}

          {children && <div className={cn("mt-4", premium && "flex justify-center")}>{children}</div>}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
