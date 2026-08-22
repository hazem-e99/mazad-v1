import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import "@/models/PlateLogo";
import {
  toAuctionDTOList,
  toPlateDTO,
  toUserDTO,
  type LeanAuction,
  type LeanPlate,
  type LeanUser,
} from "@/lib/dto";
import type { AuctionSummary } from "@/types/auction";
import type { PlateDTO } from "@/types/dto";

/** Every plate the viewer put into the system, newest first. `createdBy`
 * is the authoritative link (set on every POST /api/plates); `ownerUser`
 * is set separately by staff and may be empty, so both are matched. */
export async function getUserPlates(userId: string): Promise<PlateDTO[]> {
  await connectDB();
  const plates = await Plate.find({ $or: [{ createdBy: userId }, { ownerUser: userId }] })
    .sort({ createdAt: -1 })
    .populate("logo")
    .lean<LeanPlate[]>();
  return plates.map(toPlateDTO);
}

/** Auction ids for the viewer's plates, so "my plates" can show whether a
 * plate is currently in an auction without an N+1 lookup per card. */
export async function getPlateAuctionIndex(plateIds: string[]) {
  if (plateIds.length === 0) return new Map<string, AuctionSummary>();
  await connectDB();

  const auctions = await Auction.find({ plate: { $in: plateIds } })
    .sort({ createdAt: -1 })
    .populate({ path: "plate", populate: { path: "logo" } })
    .lean<LeanAuction[]>();

  const index = new Map<string, AuctionSummary>();
  // Sorted newest-first, so the first entry seen for a plate is its most
  // recent auction — later (older) ones must not overwrite it.
  for (const auction of toAuctionDTOList(auctions)) {
    if (!index.has(auction.plate._id)) index.set(auction.plate._id, auction);
  }
  return index;
}

export interface UserBidEntry {
  auction: AuctionSummary;
  /** The viewer's own highest bid on this auction. */
  yourBid: number;
  bidAt: string;
  isHighest: boolean;
  hasWon: boolean;
}

/**
 * The viewer's bidding history, collapsed to one row per auction. A user
 * who bid nine times on the same plate wants one line showing where they
 * stand now, not nine lines of history — so the top bid per auction is
 * selected in the database rather than by fetching every bid and reducing
 * in the page.
 */
export async function getUserBids(userId: string): Promise<UserBidEntry[]> {
  await connectDB();

  const grouped = await Bid.aggregate<{ _id: unknown; amount: number; createdAt: Date }>([
    // `$match` in an aggregation gets no schema casting, unlike `find` —
    // the id has to be a real ObjectId or the pipeline silently returns
    // nothing.
    { $match: { user: new Types.ObjectId(userId), accepted: true } },
    { $sort: { amount: -1 } },
    { $group: { _id: "$auction", amount: { $first: "$amount" }, createdAt: { $first: "$createdAt" } } },
  ]);

  if (grouped.length === 0) return [];

  const auctions = await Auction.find({ _id: { $in: grouped.map((g) => g._id) } })
    .sort({ endAt: -1 })
    .populate({ path: "plate", populate: { path: "logo" } })
    .populate("highestBidder", "name phone")
    .populate("winner", "name phone")
    .lean<LeanAuction[]>();

  const byAuction = new Map(grouped.map((g) => [String(g._id), g]));

  return toAuctionDTOList(auctions).map((auction) => {
    const mine = byAuction.get(auction._id);
    return {
      auction,
      yourBid: mine?.amount ?? 0,
      bidAt: mine?.createdAt ? new Date(mine.createdAt).toISOString() : auction.updatedAt,
      isHighest: auction.highestBidder?._id === userId,
      hasWon: auction.winner?._id === userId,
    };
  });
}

export async function getAccountUser(userId: string) {
  await connectDB();
  const user = await User.findById(userId).lean<LeanUser>();
  return user ? toUserDTO(user) : null;
}
