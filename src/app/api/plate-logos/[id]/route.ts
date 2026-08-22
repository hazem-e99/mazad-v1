import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { Plate } from "@/models/Plate";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { plateLogoUpdateSchema } from "@/lib/validation";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { deleteImage } from "@/lib/storage";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("plate_logo:manage");
    const body = plateLogoUpdateSchema.parse(await req.json());
    await connectDB();

    const logo = await PlateLogo.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" });
    if (!logo) throw Errors.notFound("الشعار");

    await AuditLog.create({
      actor: session.sub,
      action: "plate_logo.updated",
      entityType: "PlateLogo",
      entityId: logo._id,
      metadata: body,
    });

    return jsonOk(logo);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("plate_logo:manage");
    await connectDB();

    const logo = await PlateLogo.findById(id);
    if (!logo) throw Errors.notFound("الشعار");

    const usageCount = await Plate.countDocuments({ logo: logo._id });
    if (usageCount > 0) {
      throw Errors.conflict(
        `لا يمكن حذف هذا الشعار لأنه مستخدم حاليًا في ${usageCount} لوحة — يمكنك تعطيله بدلاً من ذلك`
      );
    }

    await PlateLogo.deleteOne({ _id: logo._id });
    await deleteImage(logo.image);

    await AuditLog.create({
      actor: session.sub,
      action: "plate_logo.deleted",
      entityType: "PlateLogo",
      entityId: logo._id,
      metadata: { nameAr: logo.nameAr, nameEn: logo.nameEn },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
