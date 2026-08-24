import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Bid } from "@/models/Bid";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { placeBid } from "@/services/auctionService";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { toBidDTOList, type LeanBid } from "@/lib/dto";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Paginated bid history (§ Bid History Reorganization) — the auction
 * detail page already renders the first 20 server-side; this is what
 * "عرض المزيد" fetches beyond that, same query shape (newest first) as
 * the admin bids screen already uses, just scoped to one auction and
 * without the staff-only contact fields.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    await connectDB();

    const filter = { auction: id, accepted: true };
    const [items, total] = await Promise.all([
      Bid.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name")
        .lean<LeanBid[]>(),
      Bid.countDocuments(filter),
    ]);

    return jsonOk({ items: toBidDTOList(items), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("auction:bid");

    if (!rateLimit(`bid:${session.sub}`, 20, 10_000)) throw Errors.rateLimited();

    const { bidSchema } = await getLocalizedSchemas();
    const body = bidSchema.parse(await req.json());
    const result = await placeBid({ auctionId: id, userId: session.sub, amount: body.amount });

    return jsonOk({
      accepted: true,
      currentPrice: result.auction?.currentPrice,
      endAt: result.auction?.endAt,
      extended: result.extended,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
