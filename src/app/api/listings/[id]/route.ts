import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { PlateCategory } from "@/models/PlateCategory";
import { Auction } from "@/models/Auction";
import { AuditLog } from "@/models/AuditLog";
import { getSession, requireSession, hasPermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { deleteImage } from "@/lib/storage";
import { deleteOwnershipDocument } from "@/lib/privateStorage";
import { toPlateDTO, toPlateListingDTO, type LeanPlate } from "@/lib/dto";

interface Params {
  params: Promise<{ id: string }>;
}

function isOwnerOrStaff(session: Awaited<ReturnType<typeof getSession>>, plate: { ownerUser?: unknown; createdBy: unknown }) {
  if (!session) return false;
  if (hasPermission(session, "plate:manage")) return true;
  const ownerId = plate.ownerUser ? String(plate.ownerUser) : String(plate.createdBy);
  return ownerId === session.sub;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();
    await connectDB();

    const staffCanSeeDoc = hasPermission(session, "ownership_document:view") || hasPermission(session, "plate:manage");
    const query = Plate.findById(id).populate("logo").populate("category");
    if (session) query.select("+ownershipDocument");
    const plateDoc = await query.lean<LeanPlate>();
    if (!plateDoc) throw Errors.notFound("اللوحة");

    const owner = plateDoc.ownerUser ? String(plateDoc.ownerUser) : String(plateDoc.createdBy);
    const isSelfOrStaff = Boolean(session) && (session!.sub === owner || hasPermission(session, "plate:manage"));

    if (!isSelfOrStaff && (plateDoc.submissionType !== "marketplace" || plateDoc.moderationStatus !== "approved" || !plateDoc.isVisible)) {
      throw Errors.notFound("اللوحة");
    }

    const dto = staffCanSeeDoc || session?.sub === owner ? toPlateListingDTO(plateDoc) : toPlateDTO(plateDoc);
    return jsonOk(dto);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await connectDB();

    const plate = await Plate.findById(id);
    if (!plate) throw Errors.notFound("اللوحة");
    if (!isOwnerOrStaff(session, plate)) throw Errors.forbidden();

    const { listingUpdateSchema } = await getLocalizedSchemas();
    const body = listingUpdateSchema.parse(await req.json());

    if (body.logo) {
      const logo = await PlateLogo.findById(body.logo).select("isActive");
      if (!logo || !logo.isActive) throw Errors.badRequest("شعار اللوحة المحدد غير متاح");
    }
    if (body.category) {
      const category = await PlateCategory.findById(body.category).select("isActive");
      if (!category || !category.isActive) throw Errors.badRequest("تصنيف اللوحة المحدد غير متاح");
    }

    const { ownershipDocument, contactEmail, ...rest } = body;
    const update: Record<string, unknown> = { ...rest };
    if (contactEmail !== undefined) update.contactEmail = contactEmail || null;
    if (ownershipDocument) update.ownershipDocument = ownershipDocument;

    // A resubmission after rejection goes back to pending review; edits to
    // an already-pending or already-approved listing don't change status —
    // only the dedicated moderate endpoint (staff-only) transitions those.
    if (plate.moderationStatus === "rejected") {
      update.moderationStatus = "pending";
      update.rejectionReason = null;
    }

    const updated = await Plate.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" })
      .populate("logo")
      .populate("category")
      .lean<LeanPlate>();

    await AuditLog.create({
      actor: session.sub,
      action: "listing.updated",
      entityType: "Plate",
      entityId: id,
      metadata: { fields: Object.keys(update) },
    });

    return jsonOk(toPlateDTO(updated!));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await connectDB();

    const plate = await Plate.findById(id).select("+ownershipDocument");
    if (!plate) throw Errors.notFound("اللوحة");
    if (!isOwnerOrStaff(session, plate)) throw Errors.forbidden();

    const usedByAuction = await Auction.countDocuments({ plate: plate._id });
    if (usedByAuction > 0) {
      // Referenced by an auction — never hard-delete; archive instead.
      plate.isVisible = false;
      await plate.save();
      await AuditLog.create({
        actor: session.sub,
        action: "listing.archived",
        entityType: "Plate",
        entityId: plate._id,
        metadata: { reason: "referenced_by_auction" },
      });
      return jsonOk({ success: true, archived: true });
    }

    if (plate.image) await deleteImage(plate.image);
    if (plate.ownershipDocument) await deleteOwnershipDocument(plate.ownershipDocument);
    await Plate.deleteOne({ _id: plate._id });

    await AuditLog.create({
      actor: session.sub,
      action: "listing.deleted",
      entityType: "Plate",
      entityId: plate._id,
      metadata: {},
    });

    return jsonOk({ success: true, archived: false });
  } catch (err) {
    return handleApiError(err);
  }
}
