import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { Purchase } from "@/models/Purchase";
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
    totalBids,
    totalPurchases,
  };
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
