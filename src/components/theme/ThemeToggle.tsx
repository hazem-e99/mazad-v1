"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

/**
 * The theme switch. `variant="onDark"` is for the charcoal social bar and
 * the hero, where the control sits on a dark surface in *both* themes and
 * therefore cannot take its colours from the theme tokens.
 */
export function ThemeToggle({
  className,
  variant = "surface",
}: {
  className?: string;
  variant?: "surface" | "onDark";
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslations();
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? t("theme.switchToDark") : t("theme.switchToLight")}
      title={theme === "light" ? t("theme.switchToDark") : t("theme.switchToLight")}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-md) transition-colors duration-(--duration-fast)",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
        variant === "surface"
          ? "border border-(--color-border-strong) text-(--color-text) hover:bg-(--color-surface)"
          : "text-(--color-on-charcoal-muted) hover:text-(--color-on-charcoal)",
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
    </button>
  );
}
