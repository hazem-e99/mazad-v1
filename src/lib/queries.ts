import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import { Bid } from "@/models/Bid";
import "@/models/User";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { toAuctionDTOList, toPlateDTO, toPlateDTOList, type LeanAuction, type LeanPlate } from "@/lib/dto";

export async function getMarketplaceListings(limit = 8) {
  await connectDB();
  const plates = await Plate.find({ submissionType: "marketplace", moderationStatus: "approved", isVisible: true })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .populate("logo")
    .lean<LeanPlate[]>();
  return toPlateDTOList(plates);
}

/** Brand claim, not a measured figure — the platform has no satisfaction
 * survey, so it is stated here rather than dressed up as a query result. */
const SATISFACTION_CLAIM = 98;

/**
 * The three figures behind the home page's proof band. Counts come from
 * the same collections the admin dashboard reads, so the public number
 * and the internal number can never disagree.
 */
export async function getPlatformStats() {
  await connectDB();

  const [totalBids, soldPlates] = await Promise.all([
    Bid.countDocuments({ accepted: true }),
    Auction.countDocuments({ status: { $in: ["sold", "purchased"] } }),
  ]);

  return { totalBids, soldPlates, satisfaction: SATISFACTION_CLAIM };
}

export async function getHomeAuctions() {
  await connectDB();

  const [live, endingSoon, upcoming, recentlyCompleted] = await Promise.all([
    Auction.find({ status: "live" }).sort({ endAt: 1 }).limit(8).populate({ path: "plate", populate: { path: "logo" } }).populate("highestBidder", "name").lean<LeanAuction[]>(),
    Auction.find({ status: "live" }).sort({ endAt: 1 }).limit(4).populate({ path: "plate", populate: { path: "logo" } }).lean<LeanAuction[]>(),
    Auction.find({ status: "scheduled" }).sort({ startAt: 1 }).limit(8).populate({ path: "plate", populate: { path: "logo" } }).lean<LeanAuction[]>(),
    Auction.find({ status: { $in: ["sold", "unsold", "purchased"] } })
      .sort({ finalizedAt: -1 })
      .limit(6)
      .populate({ path: "plate", populate: { path: "logo" } })
      .populate("winner", "name")
      .lean<LeanAuction[]>(),
  ]);

  return {
    live: toAuctionDTOList(live),
    endingSoon: toAuctionDTOList(endingSoon),
    upcoming: toAuctionDTOList(upcoming),
    recentlyCompleted: toAuctionDTOList(recentlyCompleted),
  };
}

export async function getVipPlates(limit = 12) {
  await connectDB();
  const plates = await Plate.find({ isVip: true, isVisible: true })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .populate("logo")
    .lean<LeanPlate[]>();
  return plates.map(toPlateDTO);
}

export async function getExclusiveAuctions(limit = 12) {
  await connectDB();
  const auctions = await Auction.find({ category: "exclusive", status: { $in: ["live", "scheduled"] } })
    .sort({ status: 1, endAt: 1 })
    .limit(limit)
    .populate({ path: "plate", populate: { path: "logo" } })
    .lean<LeanAuction[]>();
  return toAuctionDTOList(auctions);
}

const COMPLETED_STATUSES = ["sold", "unsold", "purchased"];

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
