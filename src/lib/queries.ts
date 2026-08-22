import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
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
    .populate("category")
    .lean<LeanPlate[]>();
  return toPlateDTOList(plates);
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

export async function getAuctionsList(params: {
  status?: string;
  category?: string;
  vip?: boolean;
  plateType?: string;
  search?: string;
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
      .sort({ status: 1, endAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "plate", populate: { path: "logo" } })
      .populate("highestBidder", "name")
      .lean<LeanAuction[]>(),
    Auction.countDocuments(filter),
  ]);

  return { items: toAuctionDTOList(items), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}
