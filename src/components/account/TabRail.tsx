"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export interface TabDefinition {
  key: string;
  label: string;
  count: number;
}

/**
 * Filter tabs backed by a URL query param rather than local state, so a
 * tab is linkable, survives a refresh, and restores correctly on back —
 * the same principle the listing filters follow.
 */
export function TabRail({ tabs, param = "tab", label }: { tabs: TabDefinition[]; param?: string; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? tabs[0]?.key;

  return (
    <div
      role="tablist"
      aria-label={label}
      className="mz-scroller mb-6 flex gap-1.5 overflow-x-auto border-b border-(--color-border) pb-2"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const params = new URLSearchParams(searchParams.toString());
        if (tab.key === tabs[0]?.key) params.delete(param);
        else params.set(param, tab.key);
        const query = params.toString();

        return (
          <Link
            key={tab.key}
            href={query ? `${pathname}?${query}` : pathname}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-(--radius-md) px-3.5 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
              isActive
                ? "bg-(--color-gold-tint) text-(--color-gold)"
                : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "tnum rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                isActive ? "bg-(--color-gold)/20" : "bg-(--color-surface-hover) text-(--color-text-faint)"
              )}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
