/**
 * Diagnostic utility: Find orphaned Auction documents (where referenced Plate no longer exists).
 *
 * READ-ONLY: Does NOT modify, repair, or delete any production data.
 *
 * Run with:
 *   npx tsx --env-file=.env scripts/find-orphaned-auctions.ts
 */

import { connectDB } from "../src/lib/db";
import { Auction } from "../src/models/Auction";
import { Plate } from "../src/models/Plate";
import mongoose from "mongoose";

async function main() {
  console.log("[find-orphaned-auctions] Connecting to database...");
  await connectDB();

  console.log("[find-orphaned-auctions] Scanning all auctions...");
  const auctions = await Auction.find({})
    .select("_id plate status createdAt currentPrice")
    .sort({ createdAt: -1 })
    .lean<{ _id: unknown; plate: unknown; status: string; createdAt: Date; currentPrice: number }[]>();

  console.log(`[find-orphaned-auctions] Found ${auctions.length} total auction records.`);

  const plateIds = Array.from(new Set(auctions.map((a) => String(a.plate)).filter(Boolean)));
  const existingPlates = await Plate.find({ _id: { $in: plateIds } })
    .select("_id")
    .lean<{ _id: unknown }[]>();

  const existingPlateIdSet = new Set(existingPlates.map((p) => String(p._id)));

  const orphaned = auctions.filter((a) => !existingPlateIdSet.has(String(a.plate)));

  console.log("\n=======================================================");
  console.log(`DIAGNOSTIC REPORT: ORPHANED AUCTIONS`);
  console.log("=======================================================");

  if (orphaned.length === 0) {
    console.log("No orphaned auctions found. All auctions point to existing plates.");
  } else {
    console.log(`WARNING: Found ${orphaned.length} orphaned auction record(s):\n`);
    orphaned.forEach((o, index) => {
      console.log(`[${index + 1}] Auction ID:   ${String(o._id)}`);
      console.log(`    Referenced Plate: ${String(o.plate)}`);
      console.log(`    Status:           ${o.status}`);
      console.log(`    Current Price:    ${o.currentPrice}`);
      console.log(`    Created At:       ${new Date(o.createdAt).toISOString()}`);
      console.log("-------------------------------------------------------");
    });
  }

  console.log(`\nSummary:`);
  console.log(`  Total auctions scanned: ${auctions.length}`);
  console.log(`  Valid auctions:         ${auctions.length - orphaned.length}`);
  console.log(`  Orphaned auctions:      ${orphaned.length}`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[find-orphaned-auctions] Error:", err);
  process.exit(1);
});
