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
    // `auction:sell` — closing an auction and awarding the plate is the
    // sale itself, which is why the permission list separates it from the
    // general `auction:manage` used to schedule and edit auctions. It was
    // defined but never enforced; a supervisor who may run auctions is now
    // only able to *conclude* one if they were granted this too. (Admins
    // hold every permission, so nothing changes for them.)
    await requirePermission("auction:sell");

    const result = await finalizeAuction(id, { force: true });
    if (!result) throw Errors.notFound("المزاد");

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
