"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

/**
 * The language toggle. `variant="onDark"` is for the footer and any other
 * charcoal surface that stays dark in *both* themes: those cannot take
 * their ink from `--color-text`, which is near-black under the light
 * theme and disappears against them.
 *
 * A variant rather than a `className` override because both would emit a
 * `text-*` utility of equal specificity, leaving the winner to stylesheet
 * order — which is how this button ended up invisible in the footer.
 * Mirrors ThemeToggle, which carries the same pair.
 */
export function LanguageSwitcher({
  className,
  variant = "surface",
}: {
  className?: string;
  variant?: "surface" | "onDark";
}) {
  const { locale, setLocale } = useTranslations();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) px-3 text-sm font-medium transition-colors duration-(--duration-fast)",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
        variant === "surface"
          ? "border border-(--color-border-strong) text-(--color-text) hover:bg-(--color-surface)"
          : "border border-white/35 bg-white/8 text-(--color-on-charcoal) hover:border-(--color-gold)/70 hover:bg-white/14 hover:text-(--color-gold)",
        className
      )}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}
