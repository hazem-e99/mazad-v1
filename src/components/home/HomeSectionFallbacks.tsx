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
 * these are what the reader sees in that section's place meanwhile. They
 * hold the section's own footprint so nothing below them jumps when the
 * real content arrives.
 */

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-(--radius-md) bg-(--color-surface-hover)", className)} />;
}

function SectionHeadingSkeleton() {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl space-y-3">
        <Shimmer className="h-9 w-64 sm:h-10 sm:w-80" />
        <Shimmer className="h-4 w-72 sm:w-96" />
      </div>
      <Shimmer className="h-5 w-20" />
    </div>
  );
}

/** The live stage: heading plus the two-column stage block. */
export function LiveStageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Shimmer className="h-9 w-56 sm:h-11 sm:w-72" />
        <Shimmer className="h-4 w-64 sm:w-80" />
      </div>
      <div className="grid min-h-[25rem] grid-cols-1 border-y border-(--color-border-strong) bg-(--color-surface) sm:min-h-[30rem] lg:min-h-[34rem] lg:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10 xl:p-12">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-3/4" />
          <Shimmer className="h-14 w-2/3" />
          <Shimmer className="h-12 w-full" />
          <Shimmer className="h-13 w-full" />
        </div>
        <div className="flex items-center justify-center border-t border-(--color-border) bg-(--color-bg) p-8 lg:border-s lg:border-t-0">
          <Shimmer className="aspect-[5/1] w-full max-w-[42rem]" />
        </div>
      </div>
    </div>
  );
}

/** The VIP editorial split: one tall feature beside a stack of rows. */
export function CuratedSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <SectionHeadingSkeleton />
      <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
        <Shimmer className="min-h-[25rem] rounded-(--radius-xl) sm:min-h-[31rem]" />
        <div className="divide-y divide-(--color-border) border-y border-(--color-border)">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid min-h-28 grid-cols-[7rem_1fr] items-center gap-4 py-4 sm:grid-cols-[8rem_1fr]">
              <Shimmer className="h-16" />
              <div className="space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A row of equal cards — the direct-sale strip. */
export function CardRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <SectionHeadingSkeleton />
      <div className="grid border-y border-(--color-border) lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col gap-6 border-b border-(--color-border) p-5 sm:p-7 lg:border-b-0 lg:border-s">
            <Shimmer className="aspect-[1.5/1] rounded-(--radius-lg)" />
            <div className="space-y-2">
              <Shimmer className="h-5 w-2/3" />
              <Shimmer className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked list rows — the upcoming schedule and the results strip. */
export function ListRowsSkeleton({ count = 4, height = "h-28" }: { count?: number; height?: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <SectionHeadingSkeleton />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Shimmer key={i} className={cn("w-full rounded-(--radius-xl)", height)} />
        ))}
      </div>
    </div>
  );
}

/** The three-figure proof band. */
export function StatsBandSkeleton() {
  return (
    <div
      className="grid grid-cols-1 divide-y divide-(--color-border) border-y border-(--color-border) bg-(--color-bg-elevated) sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 px-6 py-10">
          <Shimmer className="h-9 w-24 sm:h-10" />
          <Shimmer className="h-4 w-20" />
        </div>
      ))}
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
        "flex flex-col items-center justify-center gap-4 rounded-(--radius-xl) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated)/50 px-6 py-14 text-center",
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
