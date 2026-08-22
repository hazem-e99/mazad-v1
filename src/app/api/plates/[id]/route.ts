import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
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
    const { plateSchema } = await getLocalizedSchemas();
    const body = plateSchema.partial().parse(await req.json());
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

    const plate = await Plate.findByIdAndUpdate(id, { $set: { isVisible: false } }, { returnDocument: "after" });
    if (!plate) throw Errors.notFound("اللوحة");

    await AuditLog.create({
      actor: session.sub,
      action: "plate.hidden",
      entityType: "Plate",
      entityId: plate._id,
      metadata: {},
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
