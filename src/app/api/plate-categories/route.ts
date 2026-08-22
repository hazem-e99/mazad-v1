import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PlateCategory } from "@/models/PlateCategory";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError } from "@/lib/api";
import { toPlateCategoryDTOList, type LeanPlateCategory } from "@/lib/dto";

export async function GET() {
  try {
    await connectDB();
    const categories = await PlateCategory.find({ isActive: true })
      .sort({ sortOrder: 1, nameAr: 1 })
      .lean<LeanPlateCategory[]>();
    return jsonOk({ items: toPlateCategoryDTOList(categories) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("category:manage");
    const { plateCategoryCreateSchema } = await getLocalizedSchemas();
    const body = plateCategoryCreateSchema.parse(await req.json());
    await connectDB();
    const category = await PlateCategory.create({ ...body, createdBy: session.sub });

    await AuditLog.create({
      actor: session.sub,
      action: "plate_category.created",
      entityType: "PlateCategory",
      entityId: category._id,
      metadata: { nameAr: category.nameAr, nameEn: category.nameEn },
    });

    return jsonOk(category, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
