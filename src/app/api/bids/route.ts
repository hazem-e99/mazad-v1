import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Bid } from "@/models/Bid";
import "@/models/User";
import "@/models/Auction";
import "@/models/Plate";
import "@/models/PlateLogo";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("stats:view");
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 25);
    const auctionId = searchParams.get("auction");
    const userId = searchParams.get("user");
    const accepted = searchParams.get("accepted");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const filter: Record<string, unknown> = {};
    if (auctionId) filter.auction = auctionId;
    if (userId) filter.user = userId;
    if (accepted === "true") filter.accepted = true;
    else if (accepted === "false") filter.accepted = false;
    if (minAmount || maxAmount) {
      const amountFilter: Record<string, number> = {};
      if (minAmount) amountFilter.$gte = Number(minAmount);
      if (maxAmount) amountFilter.$lte = Number(maxAmount);
      filter.amount = amountFilter;
    }

    const [items, total] = await Promise.all([
      Bid.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name phone")
        .populate({ path: "auction", populate: { path: "plate", populate: { path: "logo" } } }),
      Bid.countDocuments(filter),
    ]);

    return jsonOk({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}
