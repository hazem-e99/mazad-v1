import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { plateLogoCreateSchema } from "@/lib/validation";
import { jsonOk, handleApiError } from "@/lib/api";
import { toPlateLogoDTOList, type LeanPlateLogo } from "@/lib/dto";

/**
 * Always active-only, sorted by sortOrder then name — this is the endpoint
 * the plate-creation selector (public and admin) fetches from, and it must
 * never offer a deactivated logo to a picker. The admin's own Plate Logos
 * management list (which needs inactive ones too) queries the model
 * directly in its server component instead, same as every other admin list
 * in this app — this route is the public-safe contract.
 */
export async function GET() {
  try {
    await connectDB();
    const logos = await PlateLogo.find({ isActive: true })
      .sort({ sortOrder: 1, nameAr: 1 })
      .lean<LeanPlateLogo[]>();
    return jsonOk({ items: toPlateLogoDTOList(logos) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("plate_logo:manage");
    const body = plateLogoCreateSchema.parse(await req.json());
    await connectDB();

    const logo = await PlateLogo.create({ ...body, createdBy: session.sub });

    await AuditLog.create({
      actor: session.sub,
      action: "plate_logo.created",
      entityType: "PlateLogo",
      entityId: logo._id,
      metadata: { nameAr: logo.nameAr, nameEn: logo.nameEn },
    });

    return jsonOk(logo, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
