import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { Purchase } from "@/models/Purchase";
import { User } from "@/models/User";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requirePermission("stats:view");
    await connectDB();

    const [
      totalPlates,
      vipPlates,
      totalUsers,
      activeAuctions,
      scheduledAuctions,
      soldAuctions,
      unsoldAuctions,
      totalBids,
      totalPurchases,
    ] = await Promise.all([
      Plate.countDocuments({ isVisible: true }),
      Plate.countDocuments({ isVip: true, isVisible: true }),
      User.countDocuments({}),
      Auction.countDocuments({ status: "live" }),
      Auction.countDocuments({ status: "scheduled" }),
      Auction.countDocuments({ status: "sold" }),
      Auction.countDocuments({ status: "unsold" }),
      Bid.countDocuments({ accepted: true }),
      Purchase.countDocuments({}),
    ]);

    return jsonOk({
      totalPlates,
      vipPlates,
      totalUsers,
      activeAuctions,
      scheduledAuctions,
      soldAuctions,
      unsoldAuctions,
      totalBids,
      totalPurchases,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
