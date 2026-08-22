import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { hashPassword } from "@/lib/session";
import { effectivePermissions } from "@/lib/session";
import { LEGACY_LOGO_SPECS, ensureLegacyPlateLogo } from "./plateLogoAssets";
import type { PlateType } from "@/lib/constants";
import type { Types } from "mongoose";

interface PlateSpec {
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: Types.ObjectId | null;
  isVip: boolean;
  isFeatured?: boolean;
}

async function seed() {
  await connectDB();

  console.log("Clearing existing seed-relevant collections...");
  await Promise.all([
    User.deleteMany({}),
    Plate.deleteMany({}),
    PlateLogo.deleteMany({}),
    Auction.deleteMany({}),
    Bid.deleteMany({}),
  ]);

  const adminPasswordHash = await hashPassword("Admin@12345");
  const userPasswordHash = await hashPassword("User@12345");

  const admin = await User.create({
    name: "مدير النظام",
    phone: "0500000001",
    passwordHash: adminPasswordHash,
    role: "admin",
    permissions: [],
  });

  const supervisor = await User.create({
    name: "مشرف المزادات",
    phone: "0500000002",
    passwordHash: userPasswordHash,
    role: "supervisor",
    permissions: ["auction:create", "auction:manage", "plate:manage"],
  });

  const buyers = await User.create(
    Array.from({ length: 5 }).map((_, i) => ({
      name: `مستخدم تجريبي ${i + 1}`,
      phone: `05011111${String(i).padStart(2, "0")}`,
      passwordHash: userPasswordHash,
      role: "user" as const,
      permissions: effectivePermissions("user", []),
    }))
  );

  console.log("Seeded users:", { admin: admin.phone, supervisor: supervisor.phone, buyers: buyers.length });

  const logosBySlug = new Map(
    await Promise.all(
      LEGACY_LOGO_SPECS.map(async (spec) => {
        const logo = await ensureLegacyPlateLogo(spec, String(admin._id));
        return [spec.legacySlug, logo._id] as const;
      })
    )
  );
  console.log("Seeded plate logos:", logosBySlug.size);

  const plateSpecs: PlateSpec[] = [
    { type: "private", lettersAr: "أ ب ج", lettersEn: "ABC", numbers: "1", logo: logosBySlug.get("vision") ?? null, isVip: true, isFeatured: true },
    { type: "private", lettersAr: "س ص ع", lettersEn: "SSA", numbers: "7777", logo: logosBySlug.get("swords_palm_green") ?? null, isVip: true },
    { type: "individual", lettersAr: "ن هـ و", lettersEn: "NHW", numbers: "555", logo: logosBySlug.get("diriyah") ?? null, isVip: true },
    { type: "sport", lettersAr: "ق ك م", lettersEn: "QKM", numbers: "99", logo: logosBySlug.get("swords_palm_black") ?? null, isVip: false },
    { type: "transfer", lettersAr: "ط ل م", lettersEn: "TLM", numbers: "2024", logo: null, isVip: false },
    { type: "wide", lettersAr: "ر ز س", lettersEn: "RZS", numbers: "321", logo: logosBySlug.get("vision") ?? null, isVip: false },
    { type: "small_square", lettersAr: "ح خ د", lettersEn: "HKD", numbers: "45", logo: null, isVip: false },
    { type: "small_sport", lettersAr: "ث ج ح", lettersEn: "THJ", numbers: "88", logo: logosBySlug.get("diriyah") ?? null, isVip: false },
  ];

  const plates = await Plate.create(
    plateSpecs.map((spec) => ({
      ...spec,
      isVisible: true,
      createdBy: admin._id,
    }))
  );

  console.log("Seeded plates:", plates.length);

  const now = Date.now();

  const liveAuction1 = await Auction.create({
    plate: plates[0]._id,
    category: "exclusive",
    status: "live",
    startingPrice: 5000,
    minIncrement: 200,
    currentPrice: 5000,
    startAt: new Date(now - 5 * 60_000),
    endAt: new Date(now + 6 * 60 * 60_000),
    directPurchaseEnabled: true,
    directPurchasePrice: 50000,
    createdBy: admin._id,
  });

  const liveAuction2 = await Auction.create({
    plate: plates[1]._id,
    category: "regular",
    status: "live",
    startingPrice: 2000,
    minIncrement: 100,
    currentPrice: 2000,
    startAt: new Date(now - 60_000),
    endAt: new Date(now + 3 * 60 * 60_000),
    directPurchaseEnabled: false,
    createdBy: admin._id,
  });

  // Simulate a couple of bids on liveAuction2 to populate the highest bidder.
  const bid1 = await Bid.create({ auction: liveAuction2._id, user: buyers[0]._id, amount: 2100 });
  const bid2 = await Bid.create({ auction: liveAuction2._id, user: buyers[1]._id, amount: 2300 });
  await Auction.updateOne(
    { _id: liveAuction2._id },
    {
      $set: { currentPrice: 2300, highestBid: bid2._id, highestBidder: buyers[1]._id },
      $inc: { bidCount: 2, version: 2 },
    }
  );
  void bid1;

  await Auction.create({
    plate: plates[2]._id,
    category: "regular",
    status: "scheduled",
    startingPrice: 3000,
    minIncrement: 150,
    currentPrice: 3000,
    startAt: new Date(now + 2 * 60 * 60_000),
    endAt: new Date(now + 8 * 60 * 60_000),
    directPurchaseEnabled: false,
    createdBy: supervisor._id,
  });

  await Auction.create({
    plate: plates[3]._id,
    category: "regular",
    status: "scheduled",
    startingPrice: 1500,
    minIncrement: 100,
    currentPrice: 1500,
    startAt: new Date(now + 24 * 60 * 60_000),
    endAt: new Date(now + 48 * 60 * 60_000),
    directPurchaseEnabled: true,
    directPurchasePrice: 20000,
    createdBy: supervisor._id,
  });

  const completedBid = await Bid.create({ auction: plates[4]._id, user: buyers[2]._id, amount: 4200 });
  await Auction.create({
    plate: plates[4]._id,
    category: "regular",
    status: "sold",
    startingPrice: 3000,
    minIncrement: 100,
    currentPrice: 4200,
    startAt: new Date(now - 48 * 60 * 60_000),
    endAt: new Date(now - 24 * 60 * 60_000),
    directPurchaseEnabled: false,
    highestBid: completedBid._id,
    highestBidder: buyers[2]._id,
    winner: buyers[2]._id,
    finalPrice: 4200,
    finalizedAt: new Date(now - 24 * 60 * 60_000),
    createdBy: admin._id,
  });

  await Auction.create({
    plate: plates[5]._id,
    category: "regular",
    status: "unsold",
    startingPrice: 6000,
    minIncrement: 200,
    currentPrice: 6000,
    startAt: new Date(now - 72 * 60 * 60_000),
    endAt: new Date(now - 50 * 60 * 60_000),
    directPurchaseEnabled: false,
    finalizedAt: new Date(now - 50 * 60 * 60_000),
    createdBy: admin._id,
  });

  console.log("Seeded auctions:", { liveAuction1: liveAuction1._id, liveAuction2: liveAuction2._id });
  console.log("\nSeed complete. Development credentials:");
  console.log("  Admin:      phone=0500000001 password=Admin@12345");
  console.log("  Supervisor: phone=0500000002 password=User@12345");
  console.log("  Users:      phone=0501111100..0501111104 password=User@12345");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
