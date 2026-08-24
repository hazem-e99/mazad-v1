import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Plate } from "@/models/Plate";
import { requireSession, hasPermission } from "@/lib/auth";
import { finalizeAuction } from "@/services/auctionService";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Ends a live auction immediately and computes its result (sold/unsold),
 * instead of waiting for the scheduler to hit endAt. Delegates to the same
 * finalizeAuction() used by the scheduler so the winner/finalPrice
 * computation is identical either way — this route can never choose a
 * different outcome, only trigger the existing one early (§ Manual Close:
 * confirm-only, no override).
 *
 * Two authorized callers: staff (`auction:manage`, any auction) or the
 * plate's own owner (`auction:close_own`, their own auction only) —
 * ownership is re-verified against the database here, never trusted from
 * the client.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const body = (await req.json().catch(() => ({}))) as { reason?: string };

    const isStaff = hasPermission(session, "auction:manage");
    if (!isStaff) {
      if (!hasPermission(session, "auction:close_own")) throw Errors.forbidden();
      await connectDB();
      const auction = await Auction.findById(id).select("plate");
      if (!auction) throw Errors.notFound("المزاد");
      const plate = await Plate.findById(auction.plate).select("ownerUser createdBy");
      const ownerId = String(plate?.ownerUser ?? plate?.createdBy ?? "");
      if (ownerId !== session.sub) throw Errors.forbidden();
    }

    const result = await finalizeAuction(id, { force: true, closedBy: session.sub, reason: body.reason });
    if (!result) throw Errors.notFound("المزاد");

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
