import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { placeBid } from "@/services/auctionService";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();

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
