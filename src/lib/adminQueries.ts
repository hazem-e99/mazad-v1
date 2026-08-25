import type { PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db";
import { STATS_TIMEZONE, STATS_TIMEZONE_OFFSET } from "@/lib/constants";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { Purchase } from "@/models/Purchase";
import { PageVisit } from "@/models/PageVisit";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { toAuditLogDTOList, type LeanAuditLog } from "@/lib/dto";

export async function getDashboardStats() {
  await connectDB();

  const [
    totalPlates,
    vipPlates,
    totalUsers,
    activeAuctions,
    scheduledAuctions,
    completedAuctions,
    soldAuctions,
    unsoldAuctions,
    purchasedAuctions,
    totalBids,
    totalPurchases,
  ] = await Promise.all([
    Plate.countDocuments({ isVisible: true }),
    Plate.countDocuments({ isVip: true, isVisible: true }),
    User.countDocuments({}),
    Auction.countDocuments({ status: "live" }),
    Auction.countDocuments({ status: "scheduled" }),
    Auction.countDocuments({ status: { $in: ["sold", "unsold", "purchased"] } }),
    Auction.countDocuments({ status: "sold" }),
    Auction.countDocuments({ status: "unsold" }),
    Auction.countDocuments({ status: "purchased" }),
    Bid.countDocuments({ accepted: true }),
    Purchase.countDocuments({}),
  ]);

  return {
    totalPlates,
    vipPlates,
    totalUsers,
    activeAuctions,
    scheduledAuctions,
    completedAuctions,
    soldAuctions,
    unsoldAuctions,
    purchasedAuctions,
    totalBids,
    totalPurchases,
  };
}

/** One calendar day's activity, in the timezone STATS_TIMEZONE names. */
export interface StatsDailyPoint {
  /** Local calendar day as `YYYY-MM-DD`. */
  date: string;
  bids: number;
  auctions: number;
  purchases: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar day as "YYYY-MM-DD" in STATS_TIMEZONE — shared with
 * visitService.ts so "today" means the same day everywhere it's used. */
export const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STATS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Daily activity buckets for the stats page's time-series charts —
 * accepted bids, auctions opened and direct purchases per day over the
 * trailing `days` window.
 *
 * Grouped in the database rather than by pulling documents and counting
 * in JS: these collections are append-only and grow without bound, so the
 * only part that should ever cross the wire is one row per day.
 */
export async function getStatsTimeSeries(days = 7): Promise<StatsDailyPoint[]> {
  await connectDB();

  // Riyadh has no daylight saving, so stepping back in exact 24h hops
  // never skips or repeats a local day.
  const now = Date.now();
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(dayKeyFormatter.format(new Date(now - i * DAY_MS)));

  const since = new Date(`${dayKeys[0]}T00:00:00${STATS_TIMEZONE_OFFSET}`);

  const dailyCounts = (match: Record<string, unknown> = {}): PipelineStage[] => [
    { $match: { ...match, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: STATS_TIMEZONE } },
        count: { $sum: 1 },
      },
    },
  ];

  type DayCount = { _id: string; count: number };
  const [bidRows, auctionRows, purchaseRows] = await Promise.all([
    // `accepted: true` mirrors how the totalBids card counts them, so the
    // chart and the card can never disagree.
    Bid.aggregate<DayCount>(dailyCounts({ accepted: true })),
    Auction.aggregate<DayCount>(dailyCounts()),
    Purchase.aggregate<DayCount>(dailyCounts()),
  ]);

  const indexByDay = (rows: DayCount[]) => new Map(rows.map((row) => [row._id, row.count]));
  const bids = indexByDay(bidRows);
  const auctions = indexByDay(auctionRows);
  const purchases = indexByDay(purchaseRows);

  // Days with no activity produce no group at all; the charts need every
  // day present or the axis silently collapses to however many were busy.
  return dayKeys.map((date) => ({
    date,
    bids: bids.get(date) ?? 0,
    auctions: auctions.get(date) ?? 0,
    purchases: purchases.get(date) ?? 0,
  }));
}

/**
 * "Visitor" = one unique (anonymous cookie, calendar day) row — the
 * PageVisit unique index already guarantees `visitorsToday` is an exact
 * count, not an estimate. `visitors7d` naturally counts a returning
 * visitor once per day they came back, which is the standard meaning of
 * a "visits in the last 7 days" figure, not a bug.
 */
export async function getVisitorStats() {
  await connectDB();
  const today = dayKeyFormatter.format(new Date());
  const sevenDaysAgo = dayKeyFormatter.format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [visitorsToday, visitors7d] = await Promise.all([
    PageVisit.countDocuments({ date: today }),
    PageVisit.countDocuments({ date: { $gte: sevenDaysAgo } }),
  ]);

  return { visitorsToday, visitors7d };
}

export async function getRecentAuditLogs(limit = 20) {
  await connectDB();
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).populate("actor", "name phone").lean<LeanAuditLog[]>();
  return toAuditLogDTOList(logs);
}

export interface AuditLogFilter {
  action?: string;
  entityType?: string;
  actor?: string;
  page?: number;
}

export async function getPaginatedAuditLogs(params: AuditLogFilter) {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const limit = 30;

  const filter: Record<string, unknown> = {};
  if (params.action) filter.action = { $regex: params.action, $options: "i" };
  if (params.entityType) filter.entityType = params.entityType;
  if (params.actor) filter.actor = params.actor;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actor", "name phone")
      .lean<LeanAuditLog[]>(),
    AuditLog.countDocuments(filter),
  ]);

  return { items: toAuditLogDTOList(items), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}
