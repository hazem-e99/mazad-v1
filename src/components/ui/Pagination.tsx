"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  className?: string;
}

/** Windowed page list: first, last, and up to two neighbours of the
 * current page, with gaps collapsed to an ellipsis. Keeps the control a
 * fixed width whether there are 3 pages or 300. */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push("gap");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pages - 1) out.push("gap");

  out.push(pages);
  return out;
}

export function Pagination({ page, pages, total, className }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslations();

  // Physical arrow glyphs, chosen so "previous" always points backwards
  // along the reading direction.
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (pages <= 1) return null;

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-t border-(--color-border) px-4 py-4",
        className
      )}
      aria-label={t("common.pagination")}
    >
      <p className="text-xs text-(--color-text-muted)">
        <span className="tnum font-semibold text-(--color-text)">{total}</span> {t("common.resultsCount")}
        <span className="mx-2 text-(--color-text-faint)" aria-hidden="true">
          ·
        </span>
        {t("common.pageIndicator", { page, pages })}
      </p>

      <div className="flex items-center gap-1.5">
        <IconButton size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)} aria-label={t("common.previous")}>
          <Prev className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pages).map((entry, i) =>
            entry === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-(--color-text-faint)" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => goToPage(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "tnum h-8 min-w-8 rounded-(--radius-sm) px-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  entry === page
                    ? "bg-(--color-gold) text-(--color-gold-foreground) font-semibold"
                    : "text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-text)"
                )}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <IconButton size="sm" disabled={page >= pages} onClick={() => goToPage(page + 1)} aria-label={t("common.next")}>
          <Next className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  );
}
