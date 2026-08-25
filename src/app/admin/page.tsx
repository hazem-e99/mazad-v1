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
  Eye,
  PlusCircle,
  Pencil,
  Flag,
  Activity,
} from "lucide-react";
import { getDashboardStats, getRecentAuditLogs, getVisitorStats } from "@/lib/adminQueries";
import { getServerTranslator } from "@/lib/i18n-server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/layout/EmptyState";
import { AdminRealtimeStatus } from "@/components/admin/LiveAuctionCells";
import { AdminLiveRefresher } from "@/components/admin/AdminLiveRefresher";
import { LiveBidsFeed } from "@/components/admin/LiveBidsFeed";

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
  const [stats, visitorStats, logs, { t, locale }] = await Promise.all([
    getDashboardStats(),
    getVisitorStats(),
    getRecentAuditLogs(10),
    getServerTranslator(),
  ]);

  const liveRatio = stats.totalPlates ? Math.round((stats.activeAuctions / stats.totalPlates) * 100) : 0;
  const vipRatio = stats.totalPlates ? Math.round((stats.vipPlates / stats.totalPlates) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Counters here are aggregates (COUNT queries), so a single bid
          event can't update them arithmetically without the client
          inventing numbers — this re-runs the queries instead. */}
      <AdminLiveRefresher />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-gold)">{t("admin.dashboardTitle")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--color-text)">{t("admin.dashboardSubtitle")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminRealtimeStatus />
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-gold)/30 bg-(--color-gold-tint) px-3 py-1.5 text-xs font-medium text-(--color-gold)">
            <span className="h-2 w-2 rounded-full bg-(--color-gold)" aria-hidden="true" />
            {stats.activeAuctions} {t("admin.statActiveAuctions")}
          </div>
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

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between gap-3 pb-4">
            <h2 className="text-lg font-semibold text-(--color-text)">{t("admin.statsTitle")}</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-(--color-text-faint)">{t("common.status")}</span>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-(--color-text-faint)">{t("admin.statScheduledAuctions")}</p>
                <p className="mt-3 text-2xl font-bold text-(--color-text)">{stats.scheduledAuctions}</p>
              </div>
              <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-(--color-text-faint)">{t("admin.statSold")}</p>
                <p className="mt-3 text-2xl font-bold text-(--color-sold)">{stats.soldAuctions}</p>
              </div>
              <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-(--color-text-faint)">{t("admin.statTotalBids")}</p>
                <p className="mt-3 text-2xl font-bold text-(--color-gold)">{stats.totalBids}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-(--color-text-muted)">{t("admin.statVipPlates")}</span>
                  <span className="tnum font-medium text-(--color-text)">{vipRatio}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-(--color-surface-hover)">
                  <div className="h-full rounded-full bg-(--color-gold)" style={{ width: `${vipRatio}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-(--color-text-muted)">{t("admin.statActiveAuctions")}</span>
                  <span className="tnum font-medium text-(--color-text)">{liveRatio}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-(--color-surface-hover)">
                  <div className="h-full rounded-full bg-(--color-live)" style={{ width: `${liveRatio}%` }} />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card vip className="h-full">
          <CardHeader>
            <h2 className="text-lg font-semibold text-(--color-text)">{t("admin.recentActivity")}</h2>
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
                    <li key={log._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-gold)">
                        <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-(--color-text)">{log.action}</div>
                        <div className="text-xs text-(--color-text-faint)">{log.entityType}</div>
                      </div>
                      <span className="tnum shrink-0 text-[11px] text-(--color-text-faint)">{formatDateTime(log.createdAt, locale)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bids as they commit, pushed straight from placeBid(). Replaces a
          second, identical copy of the audit list that used to sit here. */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-(--color-text)">{t("admin.liveBidsHeader")}</h2>
          <AdminRealtimeStatus />
        </CardHeader>
        <CardBody className="p-0!">
          <LiveBidsFeed />
        </CardBody>
      </Card>
    </div>
  );
}
