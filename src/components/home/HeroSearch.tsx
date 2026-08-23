"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * The hero's search field.
 *
 * It submits to /listings, whose server component already filters plates
 * by title, Arabic letters, Latin letters and numbers (`?search=`) — so
 * this is a real query against the database, not a decorative input. An
 * empty box navigates to the unfiltered listings rather than doing
 * nothing, which is what a reader pressing the button expects.
 */
export function HeroSearch() {
  const { t } = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      aria-label={t("home.searchLabel")}
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(query ? `/listings?search=${encodeURIComponent(query)}` : "/listings");
      }}
      className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-(--radius-pill) border border-white/55 bg-(--color-surface)/95 p-1.5 shadow-[0_18px_44px_-22px_rgba(41,38,32,0.55)] backdrop-blur-sm sm:gap-3 sm:p-2"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center text-(--color-text-faint)" aria-hidden="true">
        <Search className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("home.searchPlaceholder")}
        aria-label={t("home.searchLabel")}
        className="min-w-0 flex-1 bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-text-faint) sm:text-[15px]"
      />

      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-(--radius-pill) bg-(--color-brand) px-5 text-sm font-semibold text-(--color-brand-foreground) transition-colors duration-(--duration-fast) hover:bg-(--color-brand-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand) sm:px-7"
      >
        <Search className="h-4 w-4 sm:hidden" aria-hidden="true" strokeWidth={2.2} />
        <span className="hidden sm:inline">{t("home.searchAction")}</span>
        <span className="sr-only sm:hidden">{t("home.searchAction")}</span>
      </button>
    </form>
  );
}
