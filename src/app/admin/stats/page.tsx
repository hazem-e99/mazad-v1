import {
  IdCard,
  Crown,
  Users,
  Gavel,
  Clock,
  CheckCircle2,
  Trophy,
  XCircle,
  ShoppingCart,
  Eye,
  Activity,
} from "lucide-react";
import { getDashboardStats, getStatsTimeSeries, getVisitorStats } from "@/lib/adminQueries";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatWeekday } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { StatsCharts } from "./StatsCharts";

const TREND_DAYS = 7;

export const revalidate = 0;

export default async function AdminStatsPage() {
  const [stats, visitorStats, daily, { t, locale }] = await Promise.all([
    getDashboardStats(),
    getVisitorStats(),
    getStatsTimeSeries(TREND_DAYS),
    getServerTranslator(),
  ]);

  const auctionTrendData = daily.map((point) => ({
    name: formatWeekday(point.date, locale),
    value: point.auctions,
  }));

  const auctionStatusData = [
    { name: t("auction.live"), value: stats.activeAuctions, color: "#ef4444" },
    { name: t("auction.scheduled"), value: stats.scheduledAuctions, color: "#3b82f6" },
    { name: t("auction.sold"), value: stats.soldAuctions, color: "#22c55e" },
    { name: t("auction.unsold"), value: stats.unsoldAuctions, color: "#a0aec0" },
    { name: t("auction.purchased"), value: stats.purchasedAuctions, color: "#ecbd33" },
  ];

  const bidTrendData = daily.map((point) => ({
    name: formatWeekday(point.date, locale),
    value: point.bids,
  }));

  const bidsThisWeek = daily.reduce((sum, point) => sum + point.bids, 0);
  const auctionsThisWeek = daily.reduce((sum, point) => sum + point.auctions, 0);

  // Summed from the slices themselves so the "إجمالي المزادات" figure can
  // never disagree with the donut it labels — the old hand-written sum
  // added completedAuctions (which already includes sold/unsold/purchased)
  // on top of unsoldAuctions, double-counting every unsold auction.
  const totalAuctions = auctionStatusData.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-gold)">إحصائيات</p>
          <h1 className="mt-2 text-3xl font-bold text-(--color-text)">{t("admin.statsTitle")}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">نظرة شاملة على أداء منصة مزاد</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-muted)">
          <Activity className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />
          آخر {TREND_DAYS} أيام
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label={t("admin.statTotalPlates")} value={stats.totalPlates} icon={IdCard} />
        <StatCard label={t("admin.statVipPlates")} value={stats.vipPlates} icon={Crown} tone="gold" />
        <StatCard label={t("admin.statUsers")} value={stats.totalUsers} icon={Users} />
        <StatCard label={t("admin.statActiveAuctions")} value={stats.activeAuctions} icon={Gavel} tone="live" />
        <StatCard label={t("admin.statDirectPurchases")} value={stats.totalPurchases} icon={ShoppingCart} tone="gold" />
        <StatCard label={t("admin.statVisitorsToday")} value={visitorStats.visitorsToday} icon={Eye} />
      </div>

      <StatsCharts
        auctionTrendData={auctionTrendData}
        auctionStatusData={auctionStatusData}
        bidTrendData={bidTrendData}
        totalAuctions={totalAuctions}
        auctionsThisWeek={auctionsThisWeek}
        bidsThisWeek={bidsThisWeek}
        trendDays={TREND_DAYS}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.statScheduledAuctions")} value={stats.scheduledAuctions} icon={Clock} />
        <StatCard label={t("admin.statCompletedAuctions")} value={stats.completedAuctions} icon={CheckCircle2} />
        <StatCard label={t("admin.statSold")} value={stats.soldAuctions} icon={Trophy} tone="success" />
        <StatCard label={t("admin.statUnsold")} value={stats.unsoldAuctions} icon={XCircle} tone="muted" />
      </div>
    </div>
  );
}
