import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission, hasPermission } from "@/lib/auth";
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
    const raw = (await req.json()) as Record<string, unknown>;
    const parsed = plateSchema.partial().parse(raw);

    // `.partial()` makes every key optional but still applies the schema's
    // defaults, so parsing `{ notes }` comes back carrying
    // `isVip: false, isFeatured: false`. Writing that wholesale silently
    // stripped a plate's VIP and featured flags on every unrelated edit —
    // so the update is narrowed to the keys the caller actually sent.
    const patch = Object.fromEntries(
      Object.entries(parsed).filter(([key]) => Object.prototype.hasOwnProperty.call(raw, key))
    ) as typeof parsed;

    // `vip:manage` — promoting a plate onto the home page's featured panel
    // and the /vip shelf is a merchandising decision, not ordinary plate
    // editing, which is why the permission list separates the two. Keyed
    // off what was sent, so editing any other attribute of a VIP plate
    // still needs only `plate:manage`.
    if ("isVip" in patch && !hasPermission(session, "vip:manage")) {
      throw Errors.forbidden();
    }

    await connectDB();

    if (patch.logo) {
      const logo = await PlateLogo.findById(patch.logo).select("isActive");
      if (!logo || !logo.isActive) throw Errors.badRequest("شعار اللوحة المحدد غير متاح");
    }

    const plate = await Plate.findByIdAndUpdate(id, { $set: patch }, { returnDocument: "after" });
    if (!plate) throw Errors.notFound("اللوحة");

    await AuditLog.create({
      actor: session.sub,
      action: "plate.updated",
      entityType: "Plate",
      entityId: plate._id,
      metadata: patch,
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
