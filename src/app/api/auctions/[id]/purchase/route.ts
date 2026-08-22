import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { purchaseDirect } from "@/services/auctionService";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("auction:buy");

    if (!rateLimit(`purchase:${session.sub}`, 5, 10_000)) throw Errors.rateLimited();

    const result = await purchaseDirect({ auctionId: id, userId: session.sub });
    return jsonOk({ success: true, auction: result.auction });
  } catch (err) {
    return handleApiError(err);
  }
}
