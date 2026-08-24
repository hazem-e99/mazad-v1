import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import "@/models/PlateLogo";
import { PlateCategory } from "@/models/PlateCategory";
import {
  toAuctionDTOList,
  toAuctionSummaryDTOList,
  toPlateDTO,
  toPlateDTOList,
  toPlateCategoryDTOList,
  type LeanAuction,
  type LeanPlate,
  type LeanPlateCategory,
} from "@/lib/dto";

/** The statuses that mean "this auction is over", however it ended. */
const COMPLETED_STATUSES = ["sold", "unsold", "purchased"];

export const getMarketplaceListings = cache(async (limit = 8) => {
  await connectDB();
  const plates = await Plate.find({ submissionType: "marketplace", moderationStatus: "approved", isVisible: true })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .populate("logo")
    .lean<LeanPlate[]>();
  return toPlateDTOList(plates);
});

/**
 * The four figures behind the home page's stats panel.
 *
 * Every one is a count over the same collections getDashboardStats reads
 * for /admin/stats, so the public number and the internal number can
 * never disagree. Nothing here is a stated claim: an earlier revision
 * shipped a hardcoded `satisfaction: 98` percent, a figure the platform
 * has no way to measure, sitting between two real ones.
 */
export const getPlatformStats = cache(async () => {
  await connectDB();

  const [totalUsers, totalPlates, vipPlates, activeAuctions] = await Promise.all([
    User.countDocuments({}),
    Plate.countDocuments({ isVisible: true }),
    Plate.countDocuments({ isVip: true, isVisible: true }),
    Auction.countDocuments({ status: "live" }),
  ]);

  return { totalUsers, totalPlates, vipPlates, activeAuctions };
});

/**
 * The admin-managed sections shown on the home page.
 *
 * Same filter and ordering as GET /api/plate-categories, so a category
 * the admin adds, renames, reorders or deactivates changes the home page
 * with no code edit — which is the whole point of the category manager.
 */
export const getHomeCategories = cache(async () => {
  await connectDB();

  const [categories, counts] = await Promise.all([
    PlateCategory.find({ isActive: true }).sort({ sortOrder: 1, nameAr: 1 }).lean<LeanPlateCategory[]>(),
    // Grouped in the database rather than by counting each category with
    // its own query — one round trip regardless of how many categories
    // the admin has created.
    Plate.aggregate<{ _id: unknown; count: number }>([
      { $match: { isVisible: true, moderationStatus: { $nin: ["pending", "rejected"] }, category: { $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const countById = new Map(counts.map((row) => [String(row._id), row.count]));

  return toPlateCategoryDTOList(categories).map((category) => ({
    ...category,
    /** How many public plates currently sit in this category. Zero is a
     * real answer and is rendered as such — a freshly created category
     * says "0 plates" rather than being hidden. */
    plateCount: countById.get(category._id) ?? 0,
  }));
});

export type HomeCategory = Awaited<ReturnType<typeof getHomeCategories>>[number];

/**
 * Newest approved marketplace listings, strictly by submission date.
 *
 * Distinct from getMarketplaceListings, which sorts featured entries
 * first: "أحدث اللوحات" is a claim about *recency*, so promoting a
 * featured older plate into it would make the heading untrue.
 */
export const getLatestPlates = cache(async (limit = 8) => {
  await connectDB();
  const plates = await Plate.find({
    submissionType: "marketplace",
    moderationStatus: "approved",
    isVisible: true,
    // VIP plates have their own home section (FeaturedAds) — excluded
    // here so a plate never appears in both, per the "لا تكرر نفس Plate"
    // requirement.
    isVip: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("logo")
    .lean<LeanPlate[]>();
  return toPlateDTOList(plates);
});

/** Populate spec shared by every auction card query — the plate and its
 * logo are what the card actually draws. */
const withPlate = { path: "plate", populate: { path: "logo" } } as const;

/**
 * The auctions running right now, soonest to end first.
 *
 * Each home section owns its own query so one failing collection can only
 * take out its own section (the page renders each inside its own Suspense
 * + error boundary) instead of turning the whole page into a 500.
 */
export const getLiveAuctions = cache(async (limit = 8) => {
  await connectDB();
  const auctions = await Auction.find({ status: "live" })
    .sort({ endAt: 1 })
    .limit(limit)
    .populate(withPlate)
    .populate("highestBidder", "name")
    .lean<LeanAuction[]>();
  return toAuctionSummaryDTOList(auctions);
});

/** Scheduled auctions, soonest to open first. */
export const getUpcomingAuctions = cache(async (limit = 6) => {
  await connectDB();
  const auctions = await Auction.find({ status: "scheduled" })
    .sort({ startAt: 1 })
    .limit(limit)
    .populate(withPlate)
    .lean<LeanAuction[]>();
  return toAuctionSummaryDTOList(auctions);
});

/** Most recently finalised auctions — the results strip. */
export const getCompletedAuctions = cache(async (limit = 6) => {
  await connectDB();
  const auctions = await Auction.find({ status: { $in: COMPLETED_STATUSES } })
    .sort({ finalizedAt: -1 })
    .limit(limit)
    .populate(withPlate)
    .populate("winner", "name")
    .lean<LeanAuction[]>();
  return toAuctionSummaryDTOList(auctions);
});

export const getVipPlates = cache(async (limit = 12) => {
  await connectDB();
  // A submission still in (or rejected by) review is never public, even if
  // it also carries the VIP flag — the moderation gate outranks every
  // other display toggle. `null` (a legacy/admin-created plate that was
  // never part of the submission flow) stays visible.
  const plates = await Plate.find({ isVip: true, isVisible: true, moderationStatus: { $nin: ["pending", "rejected"] } })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .populate("logo")
    .lean<LeanPlate[]>();
  return plates.map(toPlateDTO);
});

/** A card-sized view of an active auction, keyed by its plate — just
 * enough for the featured-numbers cards to link to the right auction and
 * show its live figures, without pulling in the full AuctionDTO (which
 * requires a populated `plate` this call doesn't need). */
export interface FeaturedNumberAuctionLink {
  auctionId: string;
  status: "scheduled" | "live";
  currentPrice: number;
  bidCount: number;
  endAt: string;
}

/**
 * Data for the home page's "الأرقام المميزة" section (§ Featured
 * Numbers) — two tabs over the *same* Plate data every other section
 * already reads (no separate rarity/number entity exists, confirmed
 * during planning): أرقام VIP reuses getVipPlates verbatim, أرقام متاحة
 * reuses the same non-VIP marketplace filter getLatestPlates uses. Each
 * plate's linked auction (if any) is resolved in one batched query rather
 * than one query per card.
 */
export const getFeaturedNumberPlates = cache(async (limit = 12) => {
  await connectDB();
  const [vipPlates, normalPlates] = await Promise.all([
    getVipPlates(limit),
    Plate.find({
      submissionType: "marketplace",
      moderationStatus: "approved",
      isVisible: true,
      isVip: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("logo")
      .lean<LeanPlate[]>()
      .then(toPlateDTOList),
  ]);

  const plateIds = [...vipPlates, ...normalPlates].map((p) => p._id);
  const auctions = await Auction.find({ plate: { $in: plateIds }, status: { $in: ["scheduled", "live"] } })
    .select("plate status currentPrice bidCount endAt")
    .lean<{ _id: unknown; plate: unknown; status: "scheduled" | "live"; currentPrice: number; bidCount: number; endAt: Date }[]>();

  const auctionByPlate: Record<string, FeaturedNumberAuctionLink> = {};
  for (const a of auctions) {
    auctionByPlate[String(a.plate)] = {
      auctionId: String(a._id),
      status: a.status,
      currentPrice: a.currentPrice,
      bidCount: a.bidCount,
      endAt: a.endAt.toISOString(),
    };
  }

  return { vipPlates, normalPlates, auctionByPlate };
});

export async function getExclusiveAuctions(limit = 12) {
  await connectDB();
  const auctions = await Auction.find({ category: "exclusive", status: { $in: ["live", "scheduled"] } })
    .sort({ status: 1, endAt: 1 })
    .limit(limit)
    .populate({ path: "plate", populate: { path: "logo" } })
    .lean<LeanAuction[]>();
  return toAuctionDTOList(auctions);
}


/**
 * Sort orders offered to the listing UI. Whitelisted rather than passed
 * through, so a hand-edited `?sort=` can never reach Mongo as an
 * arbitrary sort spec.
 */
const SORT_ORDERS: Record<string, Record<string, 1 | -1>> = {
  ending: { endAt: 1 },
  newest: { createdAt: -1 },
  price_asc: { currentPrice: 1 },
  price_desc: { currentPrice: -1 },
};

const DEFAULT_SORT: Record<string, 1 | -1> = { status: 1, endAt: 1 };

export async function getAuctionsList(params: {
  status?: string;
  category?: string;
  vip?: boolean;
  plateType?: string;
  search?: string;
  sort?: string;
  page?: number;
}) {
  await connectDB();
  const page = params.page ?? 1;
  const limit = 12;
  const filter: Record<string, unknown> = {};

  if (params.status === "completed") filter.status = { $in: COMPLETED_STATUSES };
  else if (params.status) filter.status = params.status;

  if (params.category) filter.category = params.category;

  // VIP/plate-type/search live on the Plate document, not the Auction —
  // resolve matching plate ids first so the auction query itself still
  // filters at the database level (never "fetch everything, filter in the
  // browser").
  if (params.vip || params.plateType || params.search) {
    const plateFilter: Record<string, unknown> = {};
    if (params.vip) plateFilter.isVip = true;
    if (params.plateType) plateFilter.type = params.plateType;
    if (params.search) {
      plateFilter.$or = [
        { lettersEn: { $regex: params.search, $options: "i" } },
        { lettersAr: { $regex: params.search, $options: "i" } },
        { numbers: { $regex: params.search, $options: "i" } },
      ];
    }
    const matchingPlateIds = await Plate.find(plateFilter).select("_id").lean<{ _id: unknown }[]>();
    filter.plate = { $in: matchingPlateIds.map((p) => p._id) };
  }

  const [items, total] = await Promise.all([
    Auction.find(filter)
      .sort((params.sort && SORT_ORDERS[params.sort]) || DEFAULT_SORT)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "plate", populate: { path: "logo" } })
      .populate("highestBidder", "name")
      .lean<LeanAuction[]>(),
    Auction.countDocuments(filter),
  ]);

  return { items: toAuctionDTOList(items), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}
