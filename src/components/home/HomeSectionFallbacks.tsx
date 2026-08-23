"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Per-section loading and failure states for the home page.
 *
 * The page fetches each section's data separately precisely so that one
 * slow or failing collection cannot decide the fate of the whole page —
 * these are what the reader sees in that section's place meanwhile. Each
 * holds its section's real footprint, so nothing below it jumps when the
 * content arrives.
 */

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("mz-skeleton animate-pulse rounded-(--radius-md)", className)} />;
}

function HeadingSkeleton() {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-stretch gap-3">
        <Shimmer className="w-[3px] shrink-0 rounded-(--radius-pill)" />
        <div className="space-y-2">
          <Shimmer className="h-7 w-48 sm:h-8 sm:w-56" />
          <Shimmer className="h-3.5 w-56 sm:w-64" />
        </div>
      </div>
      <Shimmer className="h-[38px] w-32 shrink-0 rounded-(--radius-pill)" />
    </div>
  );
}

/** The warm-brown featured panel, with its row of ivory cards. */
export function FeaturedAdsSkeleton() {
  return (
    <div className="mz-panel-premium px-5 py-6 sm:px-7 sm:py-7" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-center gap-3.5">
        <Shimmer className="h-11 w-11 rounded-full bg-white/10" />
        <div className="space-y-2">
          <Shimmer className="h-6 w-44 bg-white/10" />
          <Shimmer className="h-3.5 w-32 bg-white/10" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden pt-3.5 sm:gap-[18px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="mz-card-ivory flex min-h-[11rem] w-[78%] shrink-0 flex-col rounded-[14px] px-3.5 pb-4 pt-7 sm:w-[calc((100%-18px)/2)] md:w-[calc((100%-36px)/3)] lg:w-[calc((100%-54px)/4)]"
          >
            <Shimmer className="my-auto h-14 w-[88%] self-center" />
            <Shimmer className="mx-auto h-6 w-32 rounded-(--radius-pill)" />
            <Shimmer className="mx-auto mt-3.5 h-7 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The four-figure frosted band. */
export function StatsPanelSkeleton() {
  return (
    <div className="mz-panel-stats rounded-(--radius-xl) px-2 py-5 sm:px-4 sm:py-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-3 sm:px-6">
            <Shimmer className="h-11 w-11 rounded-(--radius-md)" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-7 w-16" />
            <Shimmer className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The category row. */
export function CategoryTilesSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <HeadingSkeleton />
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer
            key={i}
            className="h-[9.5rem] w-36 shrink-0 rounded-(--radius-lg) sm:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
          />
        ))}
      </div>
    </div>
  );
}

/** A grid of equal listing cards — the newest plates. Mirrors the real
 * card's box model (radius, padding, plate stage, gaps) so the section
 * does not resize when the data lands. */
export function CardRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <HeadingSkeleton />
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-(--radius-md) border border-(--color-border-light) bg-(--color-surface)/70 px-3.5 py-3"
          >
            <div className="flex min-h-[4.75rem] items-center justify-center sm:min-h-[5.25rem]">
              <Shimmer className="h-[3.25rem] w-[88%]" />
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              <Shimmer className="h-[1.35rem] w-16 rounded-(--radius-pill)" />
              <Shimmer className="h-[1.35rem] w-14 rounded-(--radius-pill)" />
            </div>
            <Shimmer className="mx-auto mt-2 h-[1.4rem] w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * What a section renders when its own query failed. Deliberately scoped
 * to the section: the rest of the page keeps working, and the reader gets
 * a way to ask for it again without reloading everything.
 */
export function SectionError({ className }: { className?: string }) {
  const { t } = useTranslations();
  const router = useRouter();

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-(--radius-xl) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated)/60 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-(--color-text-faint)">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
      </span>
      <p className="text-sm font-semibold text-(--color-text)">{t("common.error")}</p>
      <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
