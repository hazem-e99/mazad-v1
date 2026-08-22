import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { finalizeAuction } from "@/services/auctionService";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Admin action to end a live auction immediately and compute its result
 * (sold/unsold), instead of waiting for the scheduler to hit endAt.
 * Delegates to the same finalizeAuction() used by the scheduler so the
 * winner/finalPrice computation is identical either way.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requirePermission("auction:manage");

    const result = await finalizeAuction(id, { force: true });
    if (!result) throw Errors.notFound("المزاد");

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
