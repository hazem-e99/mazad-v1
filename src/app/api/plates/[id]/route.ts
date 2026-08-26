import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { Auction } from "@/models/Auction";
import { Advertisement } from "@/models/Advertisement";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const plate = await Plate.findById(id);
    if (!plate) throw Errors.notFound("اللوحة");
    return jsonOk(plate);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("plate:manage");
    const { plateUpdateSchema } = await getLocalizedSchemas();
    const body = plateUpdateSchema.parse(await req.json());
    await connectDB();

    if (body.logo) {
      const logo = await PlateLogo.findById(body.logo).select("isActive");
      if (!logo || !logo.isActive) throw Errors.badRequest("شعار اللوحة المحدد غير متاح");
    }

    const plate = await Plate.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" });
    if (!plate) throw Errors.notFound("اللوحة");

    await AuditLog.create({
      actor: session.sub,
      action: "plate.updated",
      entityType: "Plate",
      entityId: plate._id,
      metadata: body,
    });

    return jsonOk(plate);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("plate:manage");
    await connectDB();

    const linkedAuction = await Auction.findOne({ plate: id });
    if (linkedAuction) {
      throw Errors.badRequest("لا يمكن حذف هذه اللوحة نهائيًا لأنها مرتبطة بمزاد. يمكنك إخفاؤها بدلًا من حذفها.");
    }

    const linkedAd = await Advertisement.findOne({ plate: id });
    if (linkedAd) {
      throw Errors.badRequest("لا يمكن حذف هذه اللوحة نهائيًا لأنها مرتبطة بإعلان.");
    }

    const plate = await Plate.findByIdAndDelete(id);
    if (!plate) throw Errors.notFound("اللوحة");

    await AuditLog.create({
      actor: session.sub,
      action: "plate.deleted",
      entityType: "Plate",
      entityId: plate._id,
      metadata: {
        lettersAr: plate.lettersAr,
        lettersEn: plate.lettersEn,
        numbers: plate.numbers,
        type: plate.type,
      },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
