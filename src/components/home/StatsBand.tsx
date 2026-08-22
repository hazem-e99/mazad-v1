"use client";

import { formatNumber } from "@/lib/format";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export interface PlatformStats {
  totalBids: number;
  soldPlates: number;
  satisfaction: number;
}

/**
 * The proof band. Figures come from the same counts the dashboard reads,
 * so this is never a decorative number that drifts from reality — the one
 * exception is the satisfaction percentage, which the platform does not
 * measure and which the caller supplies as a stated brand claim.
 */
export function StatsBand({ stats }: { stats: PlatformStats }) {
  const { t, locale } = useTranslations();

  const items = [
    { value: `+${formatNumber(stats.totalBids, locale)}`, label: t("home.statBids") },
    { value: `${formatNumber(stats.satisfaction, locale)}%`, label: t("home.statSatisfaction") },
    { value: `+${formatNumber(stats.soldPlates, locale)}`, label: t("home.statSold") },
  ];

  return (
    <section
      aria-label={t("home.statsLabel")}
      className="mz-edge-gold relative overflow-hidden rounded-(--radius-xl) border border-(--color-gold)/20 bg-(--color-bg-elevated)"
    >
      <span aria-hidden="true" className="mz-pattern-lines pointer-events-none absolute inset-0" />
      <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-x-0 -bottom-32 h-64 opacity-70" />

      <dl className="relative grid grid-cols-1 gap-px bg-(--color-gold)/12 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 bg-(--color-bg-elevated) px-6 py-10">
            <dt className="sr-only">{item.label}</dt>
            <dd className="tnum text-3xl font-bold tracking-tight text-(--color-gold) sm:text-4xl">{item.value}</dd>
            <p className="text-sm text-(--color-text-muted)" aria-hidden="true">
              {item.label}
            </p>
          </div>
        ))}
      </dl>
    </section>
  );
}
