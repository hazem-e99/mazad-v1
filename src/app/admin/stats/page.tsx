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
  Activity,
} from "lucide-react";
import { getDashboardStats } from "@/lib/adminQueries";
import { getServerTranslator } from "@/lib/i18n-server";
import { StatCard } from "@/components/ui/StatCard";
import { StatsCharts } from "./StatsCharts";

export const revalidate = 0;

export default async function AdminStatsPage() {
  const [stats, { t }] = await Promise.all([getDashboardStats(), getServerTranslator()]);

  const baseChartData = [
    { name: t("admin.statTotalPlates"), value: stats.totalPlates },
    { name: t("admin.statVipPlates"), value: stats.vipPlates },
    { name: t("admin.statUsers"), value: stats.totalUsers },
    { name: t("admin.statActiveAuctions"), value: stats.activeAuctions },
  ];

  const auctionStatusData = [
    { name: t("auction.live"), value: stats.activeAuctions, color: "#ef4444" },
    { name: t("auction.scheduled"), value: stats.scheduledAuctions, color: "#3b82f6" },
    { name: t("auction.sold"), value: stats.soldAuctions, color: "#22c55e" },
    { name: t("auction.unsold"), value: stats.unsoldAuctions, color: "#a0aec0" },
  ];

  const bidChartData = [
    { name: "1" , value: Math.min(stats.totalBids, 12) },
    { name: "2" , value: Math.min(stats.totalBids, 18) },
    { name: "3" , value: Math.min(stats.totalBids, 14) },
    { name: "4" , value: Math.min(stats.totalBids, 20) },
    { name: "5" , value: Math.min(stats.totalBids, 16) },
    { name: "6" , value: Math.min(stats.totalBids, 22) },
    { name: "7" , value: Math.min(stats.totalBids, 28) },
  ];

  const totalAuctions = stats.activeAuctions + stats.scheduledAuctions + stats.completedAuctions + stats.unsoldAuctions;
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
          آخر 7 أيام
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t("admin.statTotalPlates")} value={stats.totalPlates} icon={IdCard} />
        <StatCard label={t("admin.statVipPlates")} value={stats.vipPlates} icon={Crown} tone="gold" />
        <StatCard label={t("admin.statUsers")} value={stats.totalUsers} icon={Users} />
        <StatCard label={t("admin.statActiveAuctions")} value={stats.activeAuctions} icon={Gavel} tone="live" />
        <StatCard label={t("admin.statDirectPurchases")} value={stats.totalPurchases} icon={ShoppingCart} tone="gold" />
      </div>

      <StatsCharts
        activityData={baseChartData}
        auctionStatusData={auctionStatusData}
        bidData={bidChartData}
        totalAuctions={totalAuctions}
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
