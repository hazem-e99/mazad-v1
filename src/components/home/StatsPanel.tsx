"use client";

import { Crown, Gavel, IdCard, Users, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export interface PlatformStats {
  totalUsers: number;
  totalPlates: number;
  vipPlates: number;
  activeAuctions: number;
}

/**
 * The frosted ivory band under the featured panel.
 *
 * All four figures are counts the backend runs over the same collections
 * /admin/stats reads — register a user, publish a plate, flag one VIP or
 * open an auction and the matching figure moves on the next request.
 * Nothing here is a fixed number chosen to look impressive.
 */
export function StatsPanel({ stats }: { stats: PlatformStats }) {
  const { t, locale } = useTranslations();

  const items: { icon: LucideIcon; value: number; label: string; hint: string }[] = [
    { icon: Users, value: stats.totalUsers, label: t("home.statsUsers"), hint: t("home.statsUsersHint") },
    { icon: IdCard, value: stats.totalPlates, label: t("home.statsPlates"), hint: t("home.statsPlatesHint") },
    { icon: Crown, value: stats.vipPlates, label: t("home.statsPremium"), hint: t("home.statsPremiumHint") },
    { icon: Gavel, value: stats.activeAuctions, label: t("home.statsAuctions"), hint: t("home.statsAuctionsHint") },
  ];

  return (
    <section className="mz-panel-stats rounded-(--radius-xl) px-2 py-5 sm:px-4 sm:py-6" aria-label={t("home.statsLabel")}>
      <dl className="grid grid-cols-2 gap-y-6 lg:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={[
              "flex flex-col items-center gap-2 px-3 text-center sm:px-6",
              // Rules between cells, not around them: the second column in
              // the 2-up phone layout and every column but the first on
              // desktop. `border-s` keeps this correct in both directions.
              index % 2 === 1 ? "border-s border-(--color-border)" : "",
              index > 0 ? "lg:border-s lg:border-(--color-border)" : "lg:border-s-0",
            ].join(" ")}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-gold-tint) text-(--color-gold-dark)"
              aria-hidden="true"
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <dt className="text-xs font-medium text-(--color-text-muted) sm:text-sm">{item.label}</dt>
            <dd className="tnum text-2xl font-bold leading-none text-(--color-text) sm:text-3xl">
              {formatNumber(item.value, locale)}
            </dd>
            <p className="text-[11px] text-(--color-text-faint)" aria-hidden="true">
              {item.hint}
            </p>
          </div>
        ))}
      </dl>
    </section>
  );
}
