import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { AuditLog } from "@/models/AuditLog";
import { requireSession, hasPermission } from "@/lib/auth";
import { getLocalizedSchemas } from "@/lib/validation-server";
import { jsonOk, handleApiError, Errors } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const type = searchParams.get("type");
    const isVip = searchParams.get("isVip");
    const search = searchParams.get("search");

    // Excludes pending/rejected marketplace or auction-request submissions
    // — those are only ever surfaced through /api/listings (with its own
    // staff-only moderation-queue view), never leaked through this general
    // plates endpoint regardless of caller.
    const filter: Record<string, unknown> = { isVisible: true, moderationStatus: { $nin: ["pending", "rejected"] } };
    if (type) filter.type = type;
    if (isVip === "true") filter.isVip = true;
    if (search) {
      filter.$or = [
        { lettersEn: { $regex: search, $options: "i" } },
        { lettersAr: { $regex: search, $options: "i" } },
        { numbers: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Plate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("logo"),
      Plate.countDocuments(filter),
    ]);

    return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Any authenticated user may submit their own plate ("أضف لوحتك"); only
    // an admin/supervisor holding plate:create_featured may mark it VIP or
    // featured at creation time — otherwise those flags are stripped.
    const session = await requireSession();
    const { plateSchema } = await getLocalizedSchemas();
    const body = plateSchema.parse(await req.json());
    await connectDB();

    const canFeature = hasPermission(session, "plate:create_featured");
    if (!canFeature && (body.isVip || body.isFeatured)) throw Errors.forbidden();

    if (body.logo) {
      const logo = await PlateLogo.findById(body.logo).select("isActive");
      if (!logo || !logo.isActive) throw Errors.badRequest("شعار اللوحة المحدد غير متاح");
    }

    // A plate created by someone without plate:manage is a *user*
    // submission, no matter which endpoint it arrived through — so it
    // enters the same moderation queue as /api/listings rather than going
    // live. Without this, this route would be a way around the review
    // step: GET above only hides pending/rejected, and a plate created
    // here would otherwise carry moderationStatus: null and be public
    // immediately. Staff-authored plates skip moderation because the
    // author is the approving authority.
    const isStaff = hasPermission(session, "plate:manage");
    const submissionFields = isStaff
      ? {}
      : { ownerUser: session.sub, submissionType: "marketplace" as const, moderationStatus: "pending" as const };

    const plate = await Plate.create({ ...body, ...submissionFields, createdBy: session.sub });

    await AuditLog.create({
      actor: session.sub,
      action: isStaff ? "plate.created" : "listing.submitted",
      entityType: "Plate",
      entityId: plate._id,
      metadata: { type: plate.type, isVip: plate.isVip, moderationStatus: plate.moderationStatus ?? null },
    });

    return jsonOk(plate, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
