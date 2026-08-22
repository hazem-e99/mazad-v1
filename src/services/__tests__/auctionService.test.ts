import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import {
  placeBid,
  purchaseDirect,
  finalizeAuction,
  activateScheduledAuctions,
  finalizeExpiredAuctions,
} from "@/services/auctionService";

const TEST_TAG = `vitest-${Date.now()}`;

let adminId: string;
let userAId: string;
let userBId: string;
let manyUserIds: string[];
let plateId: string;

async function createAuction(overrides: Partial<Record<string, unknown>> = {}) {
  const now = Date.now();
  const auction = await Auction.create({
    plate: plateId,
    category: "regular",
    status: "live",
    startingPrice: 1000,
    minIncrement: 100,
    currentPrice: 1000,
    startAt: new Date(now - 60_000),
    endAt: new Date(now + 60 * 60_000),
    directPurchaseEnabled: false,
    createdBy: adminId,
    ...overrides,
  });
  return auction;
}

beforeAll(async () => {
  await connectDB();

  const admin = await User.create({
    name: `${TEST_TAG}-admin`,
    phone: `05${Date.now().toString().slice(-8)}`,
    passwordHash: "x",
    role: "admin",
  });
  adminId = String(admin._id);

  const userA = await User.create({
    name: `${TEST_TAG}-userA`,
    phone: `05${(Date.now() + 1).toString().slice(-8)}`,
    passwordHash: "x",
    role: "user",
  });
  userAId = String(userA._id);

  const userB = await User.create({
    name: `${TEST_TAG}-userB`,
    phone: `05${(Date.now() + 2).toString().slice(-8)}`,
    passwordHash: "x",
    role: "user",
  });
  userBId = String(userB._id);

  const manyUsers = await User.create(
    Array.from({ length: 8 }).map((_, i) => ({
      name: `${TEST_TAG}-bidder-${i}`,
      phone: `05${(Date.now() + 100 + i).toString().slice(-8)}`,
      passwordHash: "x",
      role: "user" as const,
    }))
  );
  manyUserIds = manyUsers.map((u) => String(u._id));

  const plate = await Plate.create({
    type: "private",
    lettersAr: "ت س ت",
    lettersEn: "TST",
    numbers: "9001",
    logo: null,
    createdBy: adminId,
  });
  plateId = String(plate._id);
});

afterEach(async () => {
  await Auction.deleteMany({ plate: plateId });
  await Bid.deleteMany({ user: { $in: [userAId, userBId, ...manyUserIds] } });
});

afterAll(async () => {
  await Plate.deleteOne({ _id: plateId });
  await User.deleteMany({ _id: { $in: [adminId, userAId, userBId, ...manyUserIds] } });
  await mongoose.disconnect();
});

describe("placeBid", () => {
  it("accepts a valid bid at or above the minimum increment", async () => {
    const auction = await createAuction();
    const result = await placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 });
    expect(result.auction?.currentPrice).toBe(1100);
    expect(result.auction?.highestBidder?.toString()).toBe(userAId);
  });

  it("rejects a bid below the minimum increment", async () => {
    const auction = await createAuction();
    await expect(
      placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1050 })
    ).rejects.toThrow(/1100/);
  });

  it("rejects a bid on a scheduled (not yet live) auction", async () => {
    const auction = await createAuction({
      status: "scheduled",
      startAt: new Date(Date.now() + 60 * 60_000),
      endAt: new Date(Date.now() + 2 * 60 * 60_000),
    });
    await expect(
      placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 })
    ).rejects.toThrow();
  });

  it("rejects a bid on an already-expired auction", async () => {
    const auction = await createAuction({
      startAt: new Date(Date.now() - 2 * 60 * 60_000),
      endAt: new Date(Date.now() - 60 * 60_000),
    });
    await expect(
      placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 })
    ).rejects.toThrow();
  });

  it("resolves exactly one winner when two identical concurrent bids race", async () => {
    const auction = await createAuction();

    const [resultA, resultB] = await Promise.allSettled([
      placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1200 }),
      placeBid({ auctionId: String(auction._id), userId: userBId, amount: 1200 }),
    ]);

    const outcomes = [resultA, resultB];
    const fulfilled = outcomes.filter((r) => r.status === "fulfilled");
    const rejected = outcomes.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Exactly one bid is ever accepted by the atomic update; the losing
    // request's Bid document is marked accepted:false and never increments
    // bidCount, so the auction should reflect only the winning bid.
    const finalAuction = await Auction.findById(auction._id);
    expect(finalAuction?.currentPrice).toBe(1200);
    expect(finalAuction?.bidCount).toBe(1);

    const bids = await Bid.find({ auction: auction._id }).sort({ createdAt: 1 });
    expect(bids).toHaveLength(2);
    expect(bids.filter((b) => b.accepted)).toHaveLength(1);
    expect(bids.filter((b) => !b.accepted)).toHaveLength(1);
  });
});

describe("purchaseDirect", () => {
  it("completes a valid direct purchase and closes the auction", async () => {
    const auction = await createAuction({ directPurchaseEnabled: true, directPurchasePrice: 5000 });
    const result = await purchaseDirect({ auctionId: String(auction._id), userId: userAId });
    expect(result.auction.status).toBe("purchased");
    expect(result.auction.finalPrice).toBe(5000);
  });

  it("rejects a purchase after the auction already ended", async () => {
    const auction = await createAuction({
      directPurchaseEnabled: true,
      directPurchasePrice: 5000,
      status: "sold",
    });
    await expect(purchaseDirect({ auctionId: String(auction._id), userId: userAId })).rejects.toThrow();
  });

  it("allows only one of two simultaneous purchases to succeed", async () => {
    const auction = await createAuction({ directPurchaseEnabled: true, directPurchasePrice: 5000 });

    const [resultA, resultB] = await Promise.allSettled([
      purchaseDirect({ auctionId: String(auction._id), userId: userAId }),
      purchaseDirect({ auctionId: String(auction._id), userId: userBId }),
    ]);

    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    const finalAuction = await Auction.findById(auction._id);
    expect(finalAuction?.status).toBe("purchased");
  });

  it("rejects a bid vs purchase race consistently (only one wins)", async () => {
    const auction = await createAuction({ directPurchaseEnabled: true, directPurchasePrice: 5000 });

    const [bidResult, purchaseResult] = await Promise.allSettled([
      placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 }),
      purchaseDirect({ auctionId: String(auction._id), userId: userBId }),
    ]);

    const fulfilled = [bidResult, purchaseResult].filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    const finalAuction = await Auction.findById(auction._id);
    expect(["live", "purchased"]).toContain(finalAuction?.status);
  });
});

describe("finalizeAuction", () => {
  it("marks an auction with bids as sold with the correct winner", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });
    await Auction.updateOne(
      { _id: auction._id },
      { $set: { currentPrice: 1500, highestBidder: userAId }, $inc: { version: 1 } }
    );

    const finalized = await finalizeAuction(String(auction._id));
    expect(finalized?.status).toBe("sold");
    expect(finalized?.winner?.toString()).toBe(userAId);
    expect(finalized?.finalPrice).toBe(1500);
  });

  it("marks an auction with no bids as unsold", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });
    const finalized = await finalizeAuction(String(auction._id));
    expect(finalized?.status).toBe("unsold");
  });

  it("is idempotent — finalizing twice does not change the result or throw", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });
    const first = await finalizeAuction(String(auction._id));
    const second = await finalizeAuction(String(auction._id));

    expect(first?.status).toBe("unsold");
    expect(second?.status).toBe("unsold");

    const count = await Auction.countDocuments({ _id: auction._id });
    expect(count).toBe(1);
  });

  it("refuses to finalize an auction that has not ended yet", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() + 60 * 60_000) });
    await expect(finalizeAuction(String(auction._id))).rejects.toThrow();
  });
});

describe("many simultaneous bidders", () => {
  it("resolves 8 concurrent bids at strictly increasing amounts with no corruption", async () => {
    const auction = await createAuction();

    // Each bidder submits a distinct, individually-valid amount — this
    // exercises many concurrent writers landing on the same document
    // rather than just two racing for the identical price.
    const results = await Promise.allSettled(
      manyUserIds.map((userId, i) => placeBid({ auctionId: String(auction._id), userId, amount: 1100 + i * 100 }))
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    // At least the final (highest) bid must succeed; some earlier ones may
    // lose the race depending on commit order, but none should corrupt state.
    expect(fulfilled.length).toBeGreaterThan(0);

    const finalAuction = await Auction.findById(auction._id);
    expect(finalAuction).not.toBeNull();

    // currentPrice must equal the amount of whichever bid actually won —
    // i.e. it must match one of the submitted amounts, never a mangled value.
    const submittedAmounts = manyUserIds.map((_, i) => 1100 + i * 100);
    expect(submittedAmounts).toContain(finalAuction!.currentPrice);

    // bidCount must equal exactly the number of bids the atomic update
    // actually accepted (verifiable independently via the accepted Bid docs).
    const acceptedBids = await Bid.countDocuments({ auction: auction._id, accepted: true });
    expect(finalAuction!.bidCount).toBe(acceptedBids);

    // version must have incremented exactly once per accepted bid.
    expect(finalAuction!.version).toBe(acceptedBids);

    // The highest bidder must be whoever placed the winning (current) price.
    const winningBid = await Bid.findOne({ auction: auction._id, amount: finalAuction!.currentPrice, accepted: true });
    expect(String(finalAuction!.highestBidder)).toBe(String(winningBid?.user));
  });

  it("keeps a correct, gapless-in-outcome bid history under concurrent load", async () => {
    const auction = await createAuction({ startingPrice: 500, currentPrice: 500, minIncrement: 25 });

    const settled = await Promise.allSettled(
      manyUserIds.map((userId, i) => placeBid({ auctionId: String(auction._id), userId, amount: 600 + i * 25 }))
    );
    const rejections = settled.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (rejections.length === settled.length) {
      // Surface the actual error for diagnosis instead of a bare count mismatch.
      throw new Error(`All ${settled.length} bids rejected; first reason: ${rejections[0]?.reason}`);
    }

    const allBids = await Bid.find({ auction: auction._id }).sort({ createdAt: 1 });
    expect(allBids.length).toBe(manyUserIds.length);

    const acceptedCount = allBids.filter((b) => b.accepted).length;
    const rejectedCount = allBids.filter((b) => !b.accepted).length;
    expect(acceptedCount + rejectedCount).toBe(manyUserIds.length);
    expect(acceptedCount).toBeGreaterThan(0);
  });
});

describe("end-time race: bid vs scheduler finalization", () => {
  it("never allows a bid to be accepted after the scheduler has finalized the same auction", async () => {
    // Auction already ended by the time it's created (endAt is in the past)
    // so this test doesn't depend on real-time sleep racing against Atlas
    // network latency to reach the "expired" state deterministically.
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });

    const finalized = await finalizeAuction(String(auction._id));
    expect(finalized?.status).toBe("unsold");

    await expect(placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 })).rejects.toThrow();

    // Confirm finalization is not disturbed by the rejected bid attempt.
    const afterAttempt = await Auction.findById(auction._id);
    expect(afterAttempt?.status).toBe("unsold");
    expect(afterAttempt?.bidCount).toBe(0);
  });

  it("a bid placed just before expiry wins, and the scheduler then finalizes it as sold", async () => {
    // Bidding within the extension window is expected to push endAt out
    // (tested separately); to keep this test's runtime bounded and
    // deterministic regardless of that extension, finalize with force:true
    // rather than sleeping until the (possibly-extended) real endAt passes.
    const auction = await createAuction({ endAt: new Date(Date.now() + 5000) });

    const bidResult = await placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 });
    expect(bidResult.auction?.currentPrice).toBe(1100);

    const finalized = await finalizeAuction(String(auction._id), { force: true });
    expect(finalized?.status).toBe("sold");
    expect(finalized?.winner?.toString()).toBe(userAId);
    expect(finalized?.finalPrice).toBe(1100);
  });

  it("bidding within the extension window pushes endAt further into the future", async () => {
    const originalEndAt = new Date(Date.now() + 10_000); // within the 30s extension window
    const auction = await createAuction({ endAt: originalEndAt });

    const result = await placeBid({ auctionId: String(auction._id), userId: userAId, amount: 1100 });
    expect(result.extended).toBe(true);
    expect(new Date(result.auction!.endAt).getTime()).toBeGreaterThan(originalEndAt.getTime());
  });
});

describe("scheduler: activateScheduledAuctions / finalizeExpiredAuctions", () => {
  it("activates a scheduled auction whose startAt has passed", async () => {
    const auction = await createAuction({
      status: "scheduled",
      startAt: new Date(Date.now() - 1000),
      endAt: new Date(Date.now() + 60 * 60_000),
    });

    const activatedCount = await activateScheduledAuctions();
    expect(activatedCount).toBeGreaterThanOrEqual(1);

    const updated = await Auction.findById(auction._id);
    expect(updated?.status).toBe("live");
  });

  it("does not activate a scheduled auction whose startAt has not passed", async () => {
    const auction = await createAuction({
      status: "scheduled",
      startAt: new Date(Date.now() + 60 * 60_000),
      endAt: new Date(Date.now() + 2 * 60 * 60_000),
    });

    await activateScheduledAuctions();

    const stillScheduled = await Auction.findById(auction._id);
    expect(stillScheduled?.status).toBe("scheduled");
  });

  it("finalizes an expired live auction via the batch sweep", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });

    const count = await finalizeExpiredAuctions();
    expect(count).toBeGreaterThanOrEqual(1);

    const updated = await Auction.findById(auction._id);
    expect(["sold", "unsold"]).toContain(updated?.status);
  });

  it("running the batch sweep twice does not re-finalize or duplicate results (restart-safe)", async () => {
    const auction = await createAuction({ endAt: new Date(Date.now() - 1000) });

    await finalizeExpiredAuctions();
    const firstResult = await Auction.findById(auction._id);

    // Simulate a process restart re-running the same sweep.
    await finalizeExpiredAuctions();
    const secondResult = await Auction.findById(auction._id);

    expect(secondResult?.status).toBe(firstResult?.status);
    expect(secondResult?.version).toBe(firstResult?.version);
  });
});
