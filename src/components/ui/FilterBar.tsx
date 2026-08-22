"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { SelectControl } from "@/components/ui/Input";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

interface SelectFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  searchKey?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  /** Route to reset to when the user clears every filter. Defaults to the
   * current path with no query. */
  clearHref?: string;
  className?: string;
}

/**
 * Server-backed filter/search toolbar: writes to URL query params (which
 * the page's server component reads on the next render) instead of
 * filtering an already-loaded page of results client-side.
 */
export function FilterBar({ searchKey = "search", searchPlaceholder, selects = [], clearHref, className }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();
  const urlSearchValue = searchParams.get(searchKey) ?? "";

  const activeCount =
    (urlSearchValue ? 1 : 0) + selects.filter((filter) => searchParams.get(filter.key)).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-3",
        className
      )}
    >
      <span className="hidden shrink-0 items-center gap-2 ps-1 text-xs font-semibold uppercase tracking-wide text-(--color-text-faint) lg:flex">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
        {t("common.filters")}
      </span>

      {/* Keyed by the URL's current value so navigating (back/forward, or
          an external param change) resets the field's local edit buffer
          without needing an effect to mirror external state into local. */}
      <SearchInput
        key={urlSearchValue}
        defaultValue={urlSearchValue}
        placeholder={searchPlaceholder ?? t("common.search")}
        onCommit={(value) => updateParam(searchKey, value)}
      />

      {selects.map((filter) => (
        <SelectControl
          key={filter.key}
          value={searchParams.get(filter.key) ?? ""}
          onChange={(e) => updateParam(filter.key, e.target.value)}
          aria-label={filter.label}
          className={cn(
            "h-10 w-auto min-w-36",
            searchParams.get(filter.key) && "border-(--color-gold)/45 text-(--color-gold)"
          )}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectControl>
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(clearHref ?? pathname))}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-(--radius-md) px-3 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-danger)/10 hover:text-(--color-danger) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-gold)"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {t("pages.clearFilters")}
          <span className="tnum rounded-full bg-(--color-surface-hover) px-1.5 text-[11px]">{activeCount}</span>
        </button>
      )}

      {isPending && (
        <span className="flex items-center gap-1.5 text-xs text-(--color-text-faint)" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {t("common.updating")}
        </span>
      )}
    </div>
  );
}

export function SearchInput({
  defaultValue,
  placeholder,
  onCommit,
  className,
}: {
  defaultValue: string;
  placeholder: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div
      className={cn(
        "flex h-10 min-w-52 flex-1 items-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3",
        "transition-[border-color,box-shadow] duration-(--duration-fast) focus-within:border-(--color-gold)/60 focus-within:ring-2 focus-within:ring-(--color-gold)/25",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-(--color-text-faint)" aria-hidden="true" strokeWidth={2} />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(value);
        }}
        onBlur={() => onCommit(value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-faint) focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
