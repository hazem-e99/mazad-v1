import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Advertisement } from "@/models/Advertisement";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

const moderateAdSchema = z.object({
  isActive: z.boolean(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requirePermission("ad:manage");
    const body = moderateAdSchema.parse(await req.json());
    await connectDB();

    const ad = await Advertisement.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" });
    if (!ad) throw Errors.notFound("الإعلان");

    await AuditLog.create({
      actor: session.sub,
      action: body.isActive ? "ad.activated" : "ad.deactivated",
      entityType: "Advertisement",
      entityId: ad._id,
      metadata: {},
    });

    return jsonOk(ad);
  } catch (err) {
    return handleApiError(err);
  }
}
