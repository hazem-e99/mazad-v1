import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Auction, type AuctionDoc } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import { Purchase } from "@/models/Purchase";
import { AuditLog } from "@/models/AuditLog";
import {
  AUCTION_EXTENSION_SECONDS,
  AUCTION_EXTENSION_WINDOW_SECONDS,
} from "@/lib/constants";
import { ApiError, Errors } from "@/lib/api";
import { emitAuctionEvent } from "@/lib/socket";

export interface PlaceBidResult {
  auction: (AuctionDoc & { _id: Types.ObjectId }) | null;
  bidId: Types.ObjectId;
  amount: number;
  extended: boolean;
}

/**
 * Places a bid using an atomic conditional update: the write only succeeds
 * if the auction is still live and the submitted amount still beats the
 * current price by at least minIncrement at write-time — not read-time.
 * This closes the read-compare-write race between concurrent bidders.
 */
export async function placeBid(params: {
  auctionId: string;
  userId: string;
  amount: number;
}): Promise<PlaceBidResult> {
  await connectDB();
  const { auctionId, userId, amount } = params;

  const auction = await Auction.findById(auctionId);
  if (!auction) throw Errors.notFound("المزاد");
  if (auction.status !== "live") throw Errors.conflict("المزاد غير مباشر حاليًا");

  const now = new Date();
  if (now < auction.startAt) throw Errors.conflict("المزاد لم يبدأ بعد");
  if (now >= auction.endAt) throw Errors.conflict("انتهى وقت المزاد");

  if (!Number.isFinite(amount) || amount <= 0) throw Errors.badRequest("قيمة المزايدة غير صالحة");

  const minAcceptable = auction.currentPrice + auction.minIncrement;
  if (amount < minAcceptable) {
    throw Errors.conflict(`يجب أن تكون المزايدة ${minAcceptable} ريال على الأقل`);
  }

  // Extend the auction if a bid lands within the closing window, to
  // discourage last-second sniping — matched by the same atomic update.
  const secondsToEnd = (auction.endAt.getTime() - now.getTime()) / 1000;
  const shouldExtend = secondsToEnd <= AUCTION_EXTENSION_WINDOW_SECONDS;
  const newEndAt = shouldExtend
    ? new Date(auction.endAt.getTime() + AUCTION_EXTENSION_SECONDS * 1000)
    : auction.endAt;

  const bid = await Bid.create({ auction: auction._id, user: userId, amount, accepted: true });

  // The filter re-checks status/currentPrice/version at write time so a
  // concurrent winning bid invalidates this one atomically.
  const updated = await Auction.findOneAndUpdate(
    {
      _id: auction._id,
      status: "live",
      currentPrice: auction.currentPrice,
      version: auction.version,
    },
    {
      $set: {
        currentPrice: amount,
        highestBid: bid._id,
        highestBidder: userId,
        endAt: newEndAt,
      },
      $inc: { bidCount: 1, version: 1 },
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    // Lost the race: another bid (or status change) committed first.
    await Bid.updateOne(
      { _id: bid._id },
      { $set: { accepted: false, rejectionReason: "outbid_race_lost" } }
    );
    throw Errors.conflict("سبقتك مزايدة أخرى، حاول بقيمة أعلى");
  }

  const bidder = await User.findById(userId).select("name");

  emitAuctionEvent({
    type: "bid_accepted",
    auctionId: String(auction._id),
    amount,
    bidderId: userId,
    bidderName: bidder?.name ?? "مستخدم",
    endAt: updated.endAt.toISOString(),
  });

  return { auction: updated, bidId: bid._id, amount, extended: shouldExtend };
}

export interface DirectPurchaseResult {
  auction: AuctionDoc & { _id: Types.ObjectId };
}

/**
 * Direct purchase uses the same conditional-update pattern as bidding:
 * only succeeds if the auction is still live and direct purchase is
 * still enabled, so a purchase can never race a winning last-second bid
 * (or another simultaneous purchase) into an inconsistent final state.
 */
export async function purchaseDirect(params: {
  auctionId: string;
  userId: string;
}): Promise<DirectPurchaseResult> {
  await connectDB();
  const { auctionId, userId } = params;

  const auction = await Auction.findById(auctionId);
  if (!auction) throw Errors.notFound("المزاد");
  if (auction.status !== "live") throw Errors.conflict("المزاد غير متاح للشراء الآن");
  if (!auction.directPurchaseEnabled || !auction.directPurchasePrice) {
    throw Errors.conflict("الشراء المباشر غير متاح لهذا المزاد");
  }

  const now = new Date();
  if (now < auction.startAt || now >= auction.endAt) throw Errors.conflict("المزاد غير مباشر حاليًا");

  const updated = await Auction.findOneAndUpdate(
    { _id: auction._id, status: "live", version: auction.version },
    {
      $set: {
        status: "purchased",
        purchasedBy: userId,
        purchasedAt: now,
        winner: userId,
        finalPrice: auction.directPurchasePrice,
        finalizedAt: now,
      },
      $inc: { version: 1 },
    },
    { returnDocument: "after" }
  );

  if (!updated) throw Errors.conflict("سبقك مستخدم آخر بإتمام الشراء");

  try {
    await Purchase.create({ auction: auction._id, buyer: userId, price: auction.directPurchasePrice });
  } catch (err) {
    // Unique index on `auction` guards double-purchase records even if the
    // conditional update above were ever bypassed.
    if (!(err instanceof Error && "code" in err && (err as { code?: number }).code === 11000)) throw err;
  }

  await AuditLog.create({
    actor: userId,
    action: "auction.direct_purchase",
    entityType: "Auction",
    entityId: auction._id,
    metadata: { price: auction.directPurchasePrice },
  });

  emitAuctionEvent({
    type: "direct_purchase",
    auctionId: String(auction._id),
    buyerId: userId,
    price: auction.directPurchasePrice as number,
  });

  return { auction: updated as AuctionDoc & { _id: Types.ObjectId } };
}

/**
 * Finalizes a live auction (whose end time has passed) into its correct
 * terminal result: idempotent because the conditional update only
 * transitions auctions still in "live" status — a second call (from a
 * retried cron tick, duplicate timer, or an admin manually forcing an
 * early end) finds no matching document and is a no-op.
 *
 * @param force Skip the endAt-has-passed check — used only for an admin's
 *   explicit "end auction now" action, never by the scheduler.
 */
export async function finalizeAuction(auctionId: string, options: { force?: boolean } = {}): Promise<AuctionDoc | null> {
  await connectDB();
  const auction = await Auction.findById(auctionId);
  if (!auction) return null;
  if (auction.status !== "live") return auction; // already finalized or not applicable

  const now = new Date();
  if (!options.force && now < auction.endAt) throw Errors.conflict("المزاد لم ينتهِ بعد");

  const sold = Boolean(auction.highestBidder && auction.currentPrice > auction.startingPrice);

  const updated = await Auction.findOneAndUpdate(
    { _id: auction._id, status: "live", version: auction.version },
    {
      $set: sold
        ? {
            status: "sold",
            winner: auction.highestBidder,
            finalPrice: auction.currentPrice,
            finalizedAt: now,
          }
        : {
            status: "unsold",
            finalizedAt: now,
          },
      $inc: { version: 1 },
    },
    { returnDocument: "after" }
  );

  if (updated) {
    await AuditLog.create({
      actor: auction.createdBy,
      action: "auction.finalized",
      entityType: "Auction",
      entityId: auction._id,
      metadata: { result: updated.status, finalPrice: updated.finalPrice },
    });

    emitAuctionEvent({
      type: "auction_finalized",
      auctionId: String(auction._id),
      status: updated.status,
      winnerId: updated.winner ? String(updated.winner) : undefined,
      finalPrice: updated.finalPrice ?? undefined,
    });
  }

  // If the conditional update didn't match, something else changed this
  // auction's status/version between the read above and this write (a
  // concurrent cancel, or a duplicate finalize call that already landed).
  // Re-fetch rather than returning the now-stale pre-update snapshot, so
  // the caller always sees the auction's real current state.
  if (!updated) {
    return Auction.findById(auctionId);
  }

  return updated;
}

/** Sweeps all auctions whose endAt has passed but are still "live". */
export async function finalizeExpiredAuctions(): Promise<number> {
  await connectDB();
  const expired = await Auction.find({ status: "live", endAt: { $lte: new Date() } }).select("_id");
  let count = 0;
  for (const { _id } of expired) {
    try {
      await finalizeAuction(String(_id));
      count += 1;
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
  }
  return count;
}

/** Transitions scheduled auctions whose startAt has passed into "live". */
export async function activateScheduledAuctions(): Promise<number> {
  await connectDB();
  const candidates = await Auction.find({ status: "scheduled", startAt: { $lte: new Date() } }).select("_id");
  if (candidates.length === 0) return 0;

  // Activate one at a time with a status-guarded conditional update so a
  // second process (or overlapping tick) racing the same candidate list
  // cannot double-activate or emit a duplicate auction_started event —
  // the second attempt's filter simply no longer matches.
  let activatedCount = 0;
  for (const { _id } of candidates) {
    const updated = await Auction.findOneAndUpdate(
      { _id, status: "scheduled" },
      { $set: { status: "live" }, $inc: { version: 1 } },
      { returnDocument: "after" }
    );
    if (updated) {
      activatedCount += 1;
      emitAuctionEvent({ type: "auction_started", auctionId: String(_id) });
    }
  }

  return activatedCount;
}
