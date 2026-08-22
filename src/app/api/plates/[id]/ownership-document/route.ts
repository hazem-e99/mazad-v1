import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { requireSession, hasPermission } from "@/lib/auth";
import { handleApiError, Errors } from "@/lib/api";
import { readOwnershipDocument } from "@/lib/privateStorage";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * The only path that ever reads an ownership document's bytes. Never a
 * static public URL — authorizes on every request: the submitting owner,
 * or staff holding `ownership_document:view`. Everyone else gets 403,
 * including other authenticated users.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await connectDB();

    const plate = await Plate.findById(id).select("+ownershipDocument ownerUser createdBy");
    if (!plate) throw Errors.notFound("اللوحة");
    if (!plate.ownershipDocument) throw Errors.notFound("مستند إثبات الملكية");

    const isOwner = plate.ownerUser ? String(plate.ownerUser) === session.sub : String(plate.createdBy) === session.sub;
    if (!isOwner && !hasPermission(session, "ownership_document:view")) throw Errors.forbidden();

    const { buffer, contentType } = await readOwnershipDocument(plate.ownershipDocument);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
