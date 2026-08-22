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
      className="relative overflow-hidden border-y border-(--color-border) bg-(--color-bg-elevated)"
    >
      <dl className="relative grid grid-cols-1 divide-y divide-(--color-border) sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 px-6 py-10">
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
