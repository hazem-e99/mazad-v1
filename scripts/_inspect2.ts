import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import mongoose from "mongoose";
async function main() {
  await connectDB();
  const vip = await Plate.find({ isVip: true, isVisible: true }).select("lettersAr numbers price title submissionType moderationStatus isFeatured usageType classification image").lean();
  console.log(JSON.stringify(vip, null, 1));
  await mongoose.disconnect();
}
main().catch((e)=>{console.error(e);process.exit(1);});
