"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslations();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-text) transition-colors duration-(--duration-fast) hover:bg-(--color-surface)",
        className
      )}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}
