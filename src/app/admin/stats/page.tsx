import {
  IdCard,
  Crown,
  Users,
  Gavel,
  Clock,
  CheckCircle2,
  Trophy,
  XCircle,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { getDashboardStats } from "@/lib/adminQueries";
import { getServerTranslator } from "@/lib/i18n-server";
import { StatCard } from "@/components/ui/StatCard";

export const revalidate = 0;

export default async function AdminStatsPage() {
  const [stats, { t }] = await Promise.all([getDashboardStats(), getServerTranslator()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.statsTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.statsSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label={t("admin.statTotalPlates")} value={stats.totalPlates} icon={IdCard} />
        <StatCard label={t("admin.statVipPlates")} value={stats.vipPlates} icon={Crown} tone="gold" />
        <StatCard label={t("admin.statUsers")} value={stats.totalUsers} icon={Users} />
        <StatCard label={t("admin.statActiveAuctions")} value={stats.activeAuctions} icon={Gavel} tone="live" />
        <StatCard label={t("admin.statScheduledAuctions")} value={stats.scheduledAuctions} icon={Clock} />
        <StatCard label={t("admin.statCompletedAuctions")} value={stats.completedAuctions} icon={CheckCircle2} />
        <StatCard label={t("admin.statSold")} value={stats.soldAuctions} icon={Trophy} tone="success" />
        <StatCard label={t("admin.statUnsold")} value={stats.unsoldAuctions} icon={XCircle} tone="muted" />
        <StatCard label={t("admin.statTotalBids")} value={stats.totalBids} icon={TrendingUp} />
        <StatCard label={t("admin.statDirectPurchases")} value={stats.totalPurchases} icon={ShoppingCart} tone="gold" />
      </div>
    </div>
  );
}
