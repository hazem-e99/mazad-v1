import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PlateCategory } from "@/models/PlateCategory";
import { Plate } from "@/models/Plate";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

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

    const category = await PlateCategory.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" });
    if (!category) throw Errors.notFound("التصنيف");

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
