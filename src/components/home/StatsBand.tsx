"use client";

import { formatNumber } from "@/lib/format";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export interface PlatformStats {
  totalBids: number;
  totalUsers: number;
  soldPlates: number;
}

/**
 * The proof band. All three figures are counts over the same collections
 * the admin dashboard reads, so nothing here can drift from reality.
 *
 * The middle slot used to show a hardcoded "98% satisfied customers" — a
 * number the platform has no way to measure, sitting between two real
 * ones. It is the registered-member count now: a figure the database
 * actually holds, and one that grows as the platform does.
 */
export function StatsBand({ stats }: { stats: PlatformStats }) {
  const { t, locale } = useTranslations();

  const items = [
    { value: `+${formatNumber(stats.totalBids, locale)}`, label: t("home.statBids") },
    { value: `+${formatNumber(stats.totalUsers, locale)}`, label: t("home.statsUsers") },
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
