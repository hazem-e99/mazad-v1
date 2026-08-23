import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import mongoose from "mongoose";

async function main() {
  await connectDB();
  const all = await Plate.find({ isVip: true })
    .select("lettersAr numbers title price image isVip isVisible isFeatured moderationStatus submissionType")
    .sort({ createdAt: -1 })
    .lean();

  console.log("isVip:true total =", all.length);
  for (const p of all) {
    console.log(
      [
        `${String(p.lettersAr ?? "").padEnd(8)} ${String(p.numbers ?? "").padEnd(5)}`,
        `visible=${p.isVisible}`,
        `mod=${String(p.moderationStatus)}`,
        `sub=${String(p.submissionType)}`,
        `price=${String(p.price)}`,
        `img=${p.image ? "yes" : "no"}`,
      ].join("  ")
    );
  }

  // Exactly what getVipPlates() runs.
  const shown = await Plate.find({
    isVip: true,
    isVisible: true,
    moderationStatus: { $nin: ["pending", "rejected"] },
  }).select("lettersAr numbers").lean();
  console.log("\nreturned by getVipPlates() =", shown.length);

  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
