import { cn } from "@/lib/cn";

/**
 * Loading placeholders shaped like the content they stand in for, so the
 * page does not reflow when data lands and the user can already read the
 * layout. A centred spinner would tell them nothing about what is coming.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("mz-skeleton rounded-(--radius-sm)", className)} aria-hidden="true" />;
}

export function PlateSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("aspect-[2.3/1] w-56 rounded-[0.34em]", className)} />;
}

export function AuctionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
      <div className="flex flex-col items-center gap-4 bg-(--color-bg-elevated) p-5">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <PlateSkeleton className="w-full max-w-[13rem]" />
      </div>
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="border-t border-(--color-border) p-4">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function AuctionGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <AuctionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-(--radius-lg) border border-(--color-border)" aria-hidden="true">
      <div className="flex gap-4 border-b border-(--color-border) bg-(--color-bg-elevated) px-4 py-3.5">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-(--color-border) px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]" aria-hidden="true">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-64 w-full rounded-(--radius-lg)" />
        <Skeleton className="h-40 w-full rounded-(--radius-lg)" />
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 w-full rounded-(--radius-lg)" />
        <Skeleton className="h-13 w-full rounded-(--radius-md)" />
        <Skeleton className="h-52 w-full rounded-(--radius-lg)" />
      </div>
    </div>
  );
}
