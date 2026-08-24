"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateLogoDTO } from "@/types/dto";

interface PlateLogoSelectProps {
  /** Selected logo id, or null for "no logo". */
  value: string | null;
  onChange: (id: string | null) => void;
  /** null while the list is still loading. */
  logos: PlateLogoDTO[] | null;
  loadError?: boolean;
  label?: string;
  id?: string;
  /** Forces the closed/disabled state regardless of loading — used by the
   * add-plate wizard while an earlier field in the usage-type -> shape ->
   * logo chain hasn't been picked yet. */
  disabled?: boolean;
  /** Shown in the trigger instead of the "no logo" text while `disabled`
   * is true for a dependency reason (rather than loading/error). */
  placeholder?: string;
}

/**
 * A visual, keyboard-accessible replacement for a plain <select> — the
 * plate-logo list is admin-managed and image-based, so a text dropdown
 * can't represent it. Follows the WAI-ARIA "select-only combobox" pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 *
 * Purely presentational — the caller owns the fetch (via usePlateLogos())
 * so a page needing both the selector and a live preview only fetches once.
 */
export function PlateLogoSelect({
  value,
  onChange,
  logos,
  loadError = false,
  label,
  id,
  disabled = false,
  placeholder,
}: PlateLogoSelectProps) {
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const loading = logos === null && !loadError;

  const options: (PlateLogoDTO | null)[] = [null, ...(logos ?? [])];
  const selected = value ? (logos ?? []).find((l) => l._id === value) ?? null : null;

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function openList() {
    if (loading || loadError || disabled) return;
    const idx = options.findIndex((o) => (o?._id ?? null) === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function selectIndex(i: number) {
    const opt = options[i];
    onChange(opt ? opt._id : null);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectIndex(activeIndex);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") buttonRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={triggerId} className="text-sm font-medium text-(--color-text)">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              openList();
            }
          }}
          disabled={loading || loadError || disabled}
          className="flex h-11 w-full items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          {loading ? (
            <span className="text-(--color-text-faint)">{t("common.loading")}</span>
          ) : loadError ? (
            <span className="text-(--color-danger)">{t("pages.plateLogosLoadError")}</span>
          ) : disabled && placeholder ? (
            <span className="text-(--color-text-faint)">{placeholder}</span>
          ) : selected ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size thumbnail, not worth next/image's overhead */}
              <img src={selected.image} alt="" className="h-6 w-6 shrink-0 rounded-sm bg-white/90 object-contain p-0.5" />
              <span className="truncate">{locale === "en" ? selected.nameEn : selected.nameAr}</span>
            </>
          ) : (
            <span>{t("pages.noLogoOption")}</span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 ms-auto text-(--color-text-faint) transition-transform duration-(--duration-fast)", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listboxId}-opt-${activeIndex}`}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) shadow-(--shadow-elevated) py-1 outline-none"
          >
            {options.map((opt, i) => {
              const isSelected = (opt?._id ?? null) === value;
              const name = opt ? (locale === "en" ? opt.nameEn : opt.nameAr) : t("pages.noLogoOption");
              return (
                <li
                  key={opt?._id ?? "none"}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => selectIndex(i)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer",
                    i === activeIndex && "bg-(--color-surface-hover)",
                    isSelected ? "text-(--color-gold) font-medium" : "text-(--color-text)"
                  )}
                >
                  {opt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.image} alt="" className="h-6 w-6 shrink-0 rounded-sm bg-white/90 object-contain p-0.5" />
                  ) : (
                    <span className="h-6 w-6 shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1 truncate">{name}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
