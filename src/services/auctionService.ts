import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Auction, type AuctionDoc } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import { Purchase } from "@/models/Purchase";
import { AuditLog } from "@/models/AuditLog";
import {
  AUCTION_EXTENSION_SECONDS,
  AUCTION_EXTENSION_WINDOW_SECONDS,
} from "@/lib/constants";
import { ApiError, Errors } from "@/lib/api";
import { emitAuctionEvent, newEventId, type AuctionSnapshot } from "@/lib/socket";
import { notifyUser } from "@/services/notificationService";
import type { AuctionStatus } from "@/lib/constants";

/** `ownerUser` is set by staff separately from `createdBy` and may be
 * empty — same fallback `api/auctions/[id]/route.ts` already uses to
 * resolve "who does this plate actually belong to". */
async function plateOwnerFor(plateId: unknown): Promise<string | null> {
  const plate = await Plate.findById(plateId).select("ownerUser createdBy");
  const ownerId = plate?.ownerUser ?? plate?.createdBy;
  return ownerId ? String(ownerId) : null;
}

/**
 * Builds the realtime snapshot from the document a conditional update
 * returned — i.e. state that is already committed. Nothing here is derived
 * from the caller's request body, so a snapshot can never advertise a
 * price that is not in the database.
 */
function snapshotOf(
  auction: AuctionDoc & { _id: Types.ObjectId },
  names: { highestBidderName?: string | null; winnerName?: string | null } = {}
): AuctionSnapshot {
  return {
    auctionId: String(auction._id),
    status: auction.status as AuctionStatus,
    currentPrice: auction.currentPrice,
    minIncrement: auction.minIncrement,
    bidCount: auction.bidCount ?? 0,
    startAt: auction.startAt.toISOString(),
    endAt: auction.endAt.toISOString(),
    highestBidderId: auction.highestBidder ? String(auction.highestBidder) : null,
    highestBidderName: names.highestBidderName ?? null,
    finalPrice: auction.finalPrice ?? null,
    winnerId: auction.winner ? String(auction.winner) : null,
    winnerName: names.winnerName ?? null,
    version: auction.version ?? 0,
  };
}

/** Human-readable plate label, so an admin table row can update in place
 * without the client re-fetching the auction just to know what it is. */
async function plateLabelFor(auction: AuctionDoc): Promise<string | null> {
  try {
    const plate = await Plate.findById(auction.plate)
      .select("lettersAr numbers")
      .lean<{ lettersAr?: string; numbers?: string } | null>();
    if (!plate) return null;
    return `${plate.lettersAr ?? ""} ${plate.numbers ?? ""}`.trim() || null;
  } catch {
    return null;
  }
}

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

  const bidder = await User.findById(userId).select("name phone");
  const bidderName = bidder?.name ?? "مستخدم";

  // Emitted only after the conditional update above actually committed —
  // a rejected or race-losing bid returns earlier and never reaches here,
  // so no subscriber can ever be shown a price that was not persisted.
  emitAuctionEvent(
    {
      type: "bid_accepted",
      eventId: newEventId(),
      auctionId: String(auction._id),
      bidId: String(bid._id),
      amount,
      bidderId: userId,
      bidderName,
      createdAt: new Date().toISOString(),
      endAt: updated.endAt.toISOString(),
      snapshot: snapshotOf(updated, { highestBidderName: bidderName }),
    },
    { bidderPhone: bidder?.phone ?? null, plateLabel: await plateLabelFor(updated) }
  );

  // Previous highest bidder — captured from the pre-update read above,
  // not from `updated` (which already reflects the new bidder).
  const previousHighestBidder = auction.highestBidder ? String(auction.highestBidder) : null;
  if (previousHighestBidder && previousHighestBidder !== userId) {
    void notifyUser({
      userId: previousHighestBidder,
      type: "bid.outbid",
      title: "تجاوزك مزايد آخر",
      body: `تم تجاوز مزايدتك على هذه اللوحة بمبلغ ${amount} ريال`,
      entityType: "Auction",
      entityId: String(auction._id),
      link: `/auctions/${auction._id}`,
    });
  }

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

  const finalDoc = updated as AuctionDoc & { _id: Types.ObjectId };
  const buyer = await User.findById(userId).select("name phone");

  emitAuctionEvent(
    {
      type: "direct_purchase",
      eventId: newEventId(),
      auctionId: String(auction._id),
      buyerId: userId,
      price: auction.directPurchasePrice as number,
      snapshot: snapshotOf(finalDoc, { winnerName: buyer?.name ?? null }),
    },
    { bidderPhone: buyer?.phone ?? null, plateLabel: await plateLabelFor(finalDoc) }
  );

  const purchaseLink = `/auctions/${auction._id}`;
  void notifyUser({
    userId,
    type: "auction.direct_purchase_buyer",
    title: "تم شراء اللوحة بنجاح",
    body: `أتممت شراء هذه اللوحة بمبلغ ${auction.directPurchasePrice} ريال`,
    entityType: "Auction",
    entityId: String(auction._id),
    link: purchaseLink,
  });
  const ownerId = await plateOwnerFor(auction.plate);
  if (ownerId && ownerId !== userId) {
    void notifyUser({
      userId: ownerId,
      type: "auction.direct_purchase_seller",
      title: "تم بيع لوحتك",
      body: `تم شراء لوحتك مباشرةً بمبلغ ${auction.directPurchasePrice} ريال`,
      entityType: "Auction",
      entityId: String(auction._id),
      link: purchaseLink,
    });
  }

  return { auction: finalDoc };
}

/**
 * Finalizes a live auction (whose end time has passed) into its correct
 * terminal result: idempotent because the conditional update only
 * transitions auctions still in "live" status — a second call (from a
 * retried cron tick, duplicate timer, or an admin manually forcing an
 * early end) finds no matching document and is a no-op.
 *
 * @param force Skip the endAt-has-passed check — used only for an admin's
 *   or an owner's explicit "end auction now" action, never by the
 *   scheduler.
 * @param closedBy The session id of whoever forced this early — omitted
 *   for the scheduler's own automatic sweep, which has no human actor.
 * @param reason An optional free-text reason for a manual close.
 */
export async function finalizeAuction(
  auctionId: string,
  options: { force?: boolean; closedBy?: string; reason?: string } = {}
): Promise<AuctionDoc | null> {
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
    // A real manual close (§ Manual Close) attributes the audit entry to
    // whoever actually clicked the button, not the auction's original
    // creator — `closedBy` is only ever set by that path; the scheduler's
    // automatic sweep leaves it undefined and correctly falls back to
    // `createdBy`, since there is no human actor to record there.
    await AuditLog.create({
      actor: options.closedBy ?? auction.createdBy,
      action: "auction.finalized",
      entityType: "Auction",
      entityId: auction._id,
      metadata: {
        result: updated.status,
        finalPrice: updated.finalPrice,
        forced: Boolean(options.force),
        reason: options.reason ?? null,
      },
    });

    const winnerName = updated.winner
      ? (await User.findById(updated.winner).select("name"))?.name ?? null
      : null;

    emitAuctionEvent(
      {
        type: "auction_finalized",
        eventId: newEventId(),
        auctionId: String(auction._id),
        status: updated.status,
        winnerId: updated.winner ? String(updated.winner) : undefined,
        finalPrice: updated.finalPrice ?? undefined,
        snapshot: snapshotOf(updated as AuctionDoc & { _id: Types.ObjectId }, {
          highestBidderName: winnerName,
          winnerName,
        }),
      },
      { plateLabel: await plateLabelFor(updated) }
    );

    const finalizeLink = `/auctions/${auction._id}`;
    if (updated.winner) {
      void notifyUser({
        userId: String(updated.winner),
        type: "auction.won",
        title: "فزت بالمزاد",
        body: `فزت بمزاد هذه اللوحة بسعر نهائي ${updated.finalPrice} ريال`,
        entityType: "Auction",
        entityId: String(auction._id),
        link: finalizeLink,
      });
    }
    const finalizeOwnerId = await plateOwnerFor(auction.plate);
    if (finalizeOwnerId && finalizeOwnerId !== String(updated.winner ?? "")) {
      void notifyUser({
        userId: finalizeOwnerId,
        type: updated.status === "sold" ? "auction.sold" : "auction.unsold",
        title: updated.status === "sold" ? "تم بيع لوحتك" : "انتهى المزاد بدون بيع",
        body:
          updated.status === "sold"
            ? `تم بيع لوحتك بسعر نهائي ${updated.finalPrice} ريال`
            : "انتهى المزاد على لوحتك دون وصول أي مزايدة لسعر البيع",
        entityType: "Auction",
        entityId: String(auction._id),
        link: finalizeLink,
      });
    }
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
      emitAuctionEvent(
        {
          type: "auction_started",
          eventId: newEventId(),
          auctionId: String(_id),
          snapshot: snapshotOf(updated as AuctionDoc & { _id: Types.ObjectId }),
        },
        { plateLabel: await plateLabelFor(updated) }
      );
    }
  }

  return activatedCount;
}
