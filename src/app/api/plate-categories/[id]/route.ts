import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PlateCategory } from "@/models/PlateCategory";
import { Plate } from "@/models/Plate";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { deleteImage } from "@/lib/storage";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("category:manage");
    const { plateCategoryUpdateSchema } = await getLocalizedSchemas();
    const body = plateCategoryUpdateSchema.parse(await req.json());
    await connectDB();

    // Read the outgoing artwork before the write so a replaced or cleared
    // file can be removed afterwards — otherwise every edit would leave
    // another orphan behind in local storage.
    const previous = await PlateCategory.findById(id).select("image").lean<{ image?: string | null } | null>();
    if (!previous) throw Errors.notFound("التصنيف");
    const previousImage = previous.image ?? null;

    const category = await PlateCategory.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" });
    if (!category) throw Errors.notFound("التصنيف");

    // Only when the caller actually addressed the field: an update that
    // omits `image` must leave the existing artwork alone.
    if (body.image !== undefined && previousImage && previousImage !== category.image) {
      await deleteImage(previousImage);
    }

    await AuditLog.create({
      actor: session.sub,
      action: "plate_category.updated",
      entityType: "PlateCategory",
      entityId: category._id,
      metadata: body,
    });

    return jsonOk(category);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("category:manage");
    await connectDB();

    const category = await PlateCategory.findById(id);
    if (!category) throw Errors.notFound("التصنيف");

    const usageCount = await Plate.countDocuments({ category: category._id });
    if (usageCount > 0) {
      throw Errors.conflict(`لا يمكن حذف هذا التصنيف لأنه مستخدم حاليًا في ${usageCount} لوحة — يمكنك تعطيله بدلاً من ذلك`);
    }

    await PlateCategory.deleteOne({ _id: category._id });
    // Same reasoning as the plate-logo delete: the record is gone, so its
    // artwork has no owner left and would sit in storage forever.
    if (category.image) await deleteImage(category.image);

    await AuditLog.create({
      actor: session.sub,
      action: "plate_category.deleted",
      entityType: "PlateCategory",
      entityId: category._id,
      metadata: { nameAr: category.nameAr, nameEn: category.nameEn },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
