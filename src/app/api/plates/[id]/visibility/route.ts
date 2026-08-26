import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

const visibilitySchema = z.object({
  isVisible: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("plate:manage");
    const body = visibilitySchema.parse(await req.json());
    await connectDB();

    const plate = await Plate.findByIdAndUpdate(
      id,
      { $set: { isVisible: body.isVisible } },
      { returnDocument: "after" }
    );
    if (!plate) throw Errors.notFound("اللوحة");

    await AuditLog.create({
      actor: session.sub,
      action: body.isVisible ? "plate.shown" : "plate.hidden",
      entityType: "Plate",
      entityId: plate._id,
      metadata: { isVisible: body.isVisible },
    });

    return jsonOk(plate);
  } catch (err) {
    return handleApiError(err);
  }
}
