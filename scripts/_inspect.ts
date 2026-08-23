import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import { PlateCategory } from "@/models/PlateCategory";
import { PlateLogo } from "@/models/PlateLogo";
import { Purchase } from "@/models/Purchase";
import mongoose from "mongoose";

async function main() {
  await connectDB();
  const out: Record<string, unknown> = {};
  out.users = await User.countDocuments({});
  out.plates = await Plate.countDocuments({});
  out.platesVisible = await Plate.countDocuments({ isVisible: true });
  out.vip = await Plate.countDocuments({ isVip: true });
  out.vipVisibleApproved = await Plate.countDocuments({ isVip: true, isVisible: true, moderationStatus: { $nin: ["pending", "rejected"] } });
  out.featured = await Plate.countDocuments({ isFeatured: true });
  out.marketplace = await Plate.countDocuments({ submissionType: "marketplace", moderationStatus: "approved", isVisible: true });
  out.withImage = await Plate.countDocuments({ image: { $ne: null } });
  out.auctionsByStatus = await Auction.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
  out.bids = await Bid.countDocuments({});
  out.bidsAccepted = await Bid.countDocuments({ accepted: true });
  out.purchases = await Purchase.countDocuments({});
  out.categories = await PlateCategory.find({}).lean();
  out.logos = await PlateLogo.countDocuments({});
  out.liveAuctions = await Auction.find({ status: "live" }).select("_id currentPrice bidCount endAt version").lean();
  out.plateTypes = await Plate.aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]);
  console.log(JSON.stringify(out, null, 2));
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
