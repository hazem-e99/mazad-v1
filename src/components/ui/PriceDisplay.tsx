"use client";

import { formatNumber } from "@/lib/format";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

type PriceSize = "sm" | "md" | "lg" | "xl";

const valueSize: Record<PriceSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl",
};

const currencySize: Record<PriceSize, string> = {
  sm: "text-[0.68em]",
  md: "text-[0.6em]",
  lg: "text-[0.5em]",
  xl: "text-[0.45em]",
};

/**
 * The money figure, everywhere. The currency word is deliberately set
 * smaller and quieter than the amount so a price column scans as numbers
 * first — and it stays part of the same element so screen readers still
 * announce "1,500 riyal", not a bare number.
 */
export function PriceDisplay({
  amount,
  label,
  size = "md",
  tone = "gold",
  className,
}: {
  amount: number;
  label?: string;
  size?: PriceSize;
  tone?: "gold" | "plain" | "success";
  className?: string;
}) {
  const { locale, t } = useTranslations();

  return (
    <span className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      {label && <span className="text-xs text-(--color-text-muted)">{label}</span>}
      <span
        className={cn(
          "tnum inline-flex items-baseline gap-1 font-bold leading-none",
          valueSize[size],
          tone === "gold" && "text-(--color-gold)",
          tone === "plain" && "text-(--color-text)",
          tone === "success" && "text-(--color-sold)"
        )}
      >
        {formatNumber(amount, locale)}
        <span className={cn("font-medium text-(--color-text-muted)", currencySize[size])}>{t("common.riyal")}</span>
      </span>
    </span>
  );
}
