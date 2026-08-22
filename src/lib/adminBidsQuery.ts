import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Bid } from "@/models/Bid";
import "@/models/User";
import "@/models/Auction";
import "@/models/Plate";
import { idToString, dateToISOString, isPopulated } from "@/lib/serialize";
import type { PlateType } from "@/lib/constants";

export interface AdminBidsFilter {
  auction?: string;
  user?: string;
  accepted?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
}

/**
 * Admin-bids-specific composite DTO: this screen needs the bid's parent
 * auction's plate (for the "اللوحة" column) and the bidder's phone number
 * (not part of the generic BidDTO/UserRefDTO used elsewhere), so it gets
 * its own shape rather than force-fitting the shared one.
 */
export interface AdminBidRowDTO {
  _id: string;
  amount: number;
  accepted: boolean;
  rejectionReason: string | null;
  createdAt: string;
  user: { name: string; phone: string } | null;
  auction: { _id: string; plate: { lettersAr: string; numbers: string } } | null;
}

type ObjectIdLike = Types.ObjectId | string;

interface LeanBidUser {
  _id: ObjectIdLike;
  name: string;
  phone: string;
}

interface LeanBidAuctionPlate {
  _id: ObjectIdLike;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
}

interface LeanBidAuction {
  _id: ObjectIdLike;
  plate: LeanBidAuctionPlate | ObjectIdLike;
}

interface LeanAdminBid {
  _id: ObjectIdLike;
  amount: number;
  accepted: boolean;
  rejectionReason?: string | null;
  createdAt: Date | string;
  user: LeanBidUser | ObjectIdLike;
  auction: LeanBidAuction | ObjectIdLike;
}

function toAdminBidRowDTO(bid: LeanAdminBid): AdminBidRowDTO {
  const user = isPopulated<LeanBidUser>(bid.user as LeanBidUser)
    ? { name: (bid.user as LeanBidUser).name, phone: (bid.user as LeanBidUser).phone }
    : null;

  let auction: AdminBidRowDTO["auction"] = null;
  if (isPopulated<LeanBidAuction>(bid.auction as LeanBidAuction)) {
    const a = bid.auction as LeanBidAuction;
    auction = {
      _id: idToString(a._id),
      plate: isPopulated<LeanBidAuctionPlate>(a.plate as LeanBidAuctionPlate)
        ? {
            lettersAr: (a.plate as LeanBidAuctionPlate).lettersAr,
            numbers: (a.plate as LeanBidAuctionPlate).numbers,
          }
        : { lettersAr: "", numbers: "" },
    };
  }

  return {
    _id: idToString(bid._id),
    amount: bid.amount,
    accepted: bid.accepted,
    rejectionReason: bid.rejectionReason ?? null,
    createdAt: dateToISOString(bid.createdAt),
    user,
    auction,
  };
}

export async function getAdminBids(params: AdminBidsFilter) {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const limit = 25;

  const filter: Record<string, unknown> = {};
  if (params.auction) filter.auction = params.auction;
  if (params.user) filter.user = params.user;
  if (params.accepted === "true") filter.accepted = true;
  else if (params.accepted === "false") filter.accepted = false;
  if (params.minAmount || params.maxAmount) {
    const amountFilter: Record<string, number> = {};
    if (params.minAmount) amountFilter.$gte = Number(params.minAmount);
    if (params.maxAmount) amountFilter.$lte = Number(params.maxAmount);
    filter.amount = amountFilter;
  }

  const [items, total] = await Promise.all([
    Bid.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name phone")
      .populate({ path: "auction", populate: { path: "plate" } })
      .lean<LeanAdminBid[]>(),
    Bid.countDocuments(filter),
  ]);

  return { items: items.map(toAdminBidRowDTO), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}
