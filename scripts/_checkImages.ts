import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { access } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

async function onDisk(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return "NOT-AN-UPLOAD-PATH";
  const relative = publicPath.replace(/^\/uploads\//, "");
  const full = path.resolve(path.resolve(UPLOAD_DIR), relative);
  return access(full).then(
    () => "OK",
    () => "MISSING"
  );
}

async function main() {
  await connectDB();

  const listings = await Plate.find({
    submissionType: "marketplace",
    moderationStatus: "approved",
    isVisible: true,
  })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(10)
    .populate("logo")
    .lean();

  console.log(`marketplace listings returned: ${listings.length}\n`);
  for (const p of listings as Record<string, unknown>[]) {
    const image = p.image as string | null | undefined;
    const logo = p.logo as { nameAr?: string; image?: string } | null;
    console.log("-".repeat(70));
    console.log("title      :", p.title);
    console.log("image      :", JSON.stringify(image));
    console.log("image disk :", image ? await onDisk(image) : "(no image field)");
    console.log("logo       :", logo ? JSON.stringify(logo.image) : "(null)");
    console.log("logo disk  :", logo?.image ? await onDisk(logo.image) : "(n/a)");
  }

  // Whole-collection sweep so the report is not limited to the home page.
  const all = await Plate.find({ image: { $ne: null } }).select("title image").lean();
  let missing = 0;
  const missingPaths: string[] = [];
  for (const p of all as Record<string, unknown>[]) {
    const image = p.image as string;
    if ((await onDisk(image)) !== "OK") {
      missing += 1;
      missingPaths.push(`${String(p.title)} -> ${image}`);
    }
  }
  console.log("\n" + "=".repeat(70));
  console.log(`plates with an image path: ${all.length}`);
  console.log(`…whose file is missing on disk: ${missing}`);
  missingPaths.slice(0, 20).forEach((m) => console.log("  ", m));

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
