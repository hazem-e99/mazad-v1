export default function Loading() {
  return (
    <div className="min-h-screen bg-(--color-bg) px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-12 w-40 animate-pulse rounded-full bg-(--color-surface-hover)" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-6">
            <div className="h-8 w-3/4 animate-pulse rounded-md bg-(--color-surface-hover)" />
            <div className="h-4 w-full animate-pulse rounded-md bg-(--color-surface-hover)" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-(--color-surface-hover)" />
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-32 animate-pulse rounded-(--radius-md) bg-(--color-surface-hover)" />
              <div className="h-12 w-32 animate-pulse rounded-(--radius-md) bg-(--color-surface-hover)" />
            </div>
          </div>

          <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-6">
            <div className="mx-auto h-48 w-full max-w-md animate-pulse rounded-(--radius-lg) bg-(--color-surface-hover)" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
              <div className="mb-4 h-10 w-24 animate-pulse rounded-md bg-(--color-surface-hover)" />
              <div className="h-40 w-full animate-pulse rounded-(--radius-md) bg-(--color-surface-hover)" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded-md bg-(--color-surface-hover)" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-(--color-surface-hover)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
