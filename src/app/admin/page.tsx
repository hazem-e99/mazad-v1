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
  PlusCircle,
  Pencil,
  Flag,
  Activity,
} from "lucide-react";
import { getDashboardStats, getRecentAuditLogs } from "@/lib/adminQueries";
import { getServerTranslator } from "@/lib/i18n-server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/layout/EmptyState";

export const revalidate = 0;

const activityIcon: Record<string, typeof Activity> = {
  created: PlusCircle,
  updated: Pencil,
  finalized: Flag,
};

function iconForAction(action: string) {
  const suffix = action.split(".")[1];
  return (suffix && activityIcon[suffix]) || Activity;
}

export default async function AdminDashboardPage() {
  const [stats, logs, { t, locale }] = await Promise.all([
    getDashboardStats(),
    getRecentAuditLogs(10),
    getServerTranslator(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.dashboardTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.dashboardSubtitle")}</p>
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

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.recentActivity")}</h2>
        </CardHeader>
        <CardBody className="p-0!">
          {logs.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Activity} title={t("admin.noActivityYet")} />
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-(--color-border)">
              {logs.map((log) => {
                const Icon = iconForAction(log.action);
                return (
                  <li key={log._id} className="px-5 py-3 flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-surface-hover) text-(--color-text-muted)">
                      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-(--color-text)">{log.action}</span>
                      <span className="text-(--color-text-faint)"> — {log.entityType}</span>
                    </div>
                    <span className="tnum shrink-0 text-xs text-(--color-text-faint)">{formatDateTime(log.createdAt, locale)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
