"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface SelectFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  searchKey?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
}

/**
 * Server-backed filter/search toolbar: writes to URL query params (which the
 * page's server component reads on the next render) instead of filtering an
 * already-loaded page of results client-side.
 */
export function FilterBar({ searchKey = "search", searchPlaceholder, selects = [] }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();
  const urlSearchValue = searchParams.get(searchKey) ?? "";

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
    <div className="flex flex-wrap items-center gap-3">
      {/* Keyed by the URL's current value so navigating (back/forward, or an
          external param change) resets the field's local edit buffer without
          needing an effect to mirror external state into local state. */}
      <SearchInput
        key={urlSearchValue}
        defaultValue={urlSearchValue}
        placeholder={searchPlaceholder ?? t("common.search")}
        onCommit={(value) => updateParam(searchKey, value)}
      />
      {selects.map((filter) => (
        <select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ""}
          onChange={(e) => updateParam(filter.key, e.target.value)}
          className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm"
          aria-label={filter.label}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {isPending && <span className="text-xs text-(--color-text-faint)">{t("common.updating")}</span>}
    </div>
  );
}

function SearchInput({
  defaultValue,
  placeholder,
  onCommit,
}: {
  defaultValue: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value);
      }}
      onBlur={() => onCommit(value)}
      placeholder={placeholder}
      className="h-10 min-w-48 flex-1 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm"
      aria-label={placeholder}
    />
  );
}
