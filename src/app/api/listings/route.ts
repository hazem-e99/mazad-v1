import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateLogo } from "@/models/PlateLogo";
import { PlateCategory } from "@/models/PlateCategory";
import { AuditLog } from "@/models/AuditLog";
import { requireSession, getSession, hasPermission } from "@/lib/auth";
import { listingSubmitSchema } from "@/lib/validation";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { toPlateDTOList, type LeanPlate } from "@/lib/dto";

const canModerateQueue = (session: Awaited<ReturnType<typeof getSession>>) =>
  hasPermission(session, "listing:moderate") || hasPermission(session, "plate:manage");

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 12);

    const session = await getSession();
    const staffView = canModerateQueue(session) && searchParams.get("staff") === "true";

    const filter: Record<string, unknown> = { submissionType: { $ne: null } };

    if (staffView) {
      const status = searchParams.get("status");
      if (status && status !== "all") filter.moderationStatus = status;
      const submissionType = searchParams.get("submissionType");
      if (submissionType) filter.submissionType = submissionType;
    } else {
      filter.submissionType = "marketplace";
      filter.moderationStatus = "approved";
      filter.isVisible = true;
    }

    const classification = searchParams.get("classification");
    if (classification) filter.classification = classification;
    const usageType = searchParams.get("usageType");
    if (usageType) filter.usageType = usageType;
    const category = searchParams.get("category");
    if (category) filter.category = category;
    const logo = searchParams.get("logo");
    if (logo) filter.logo = logo;
    const size = searchParams.get("size");
    if (size) filter.size = size;
    const shape = searchParams.get("shape");
    if (shape) filter.shape = shape;
    if (searchParams.get("vip") === "true") filter.isVip = true;

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.price = priceFilter;
    }

    const search = searchParams.get("search");
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { lettersEn: { $regex: search, $options: "i" } },
        { lettersAr: { $regex: search, $options: "i" } },
        { numbers: { $regex: search, $options: "i" } },
      ];
    }

    const owner = searchParams.get("owner");
    if (owner && session && (owner === session.sub || hasPermission(session, "plate:manage"))) {
      filter.ownerUser = owner;
    }

    const [items, total] = await Promise.all([
      Plate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("logo")
        .populate("category")
        .lean<LeanPlate[]>(),
      Plate.countDocuments(filter),
    ]);

    return jsonOk({ items: toPlateDTOList(items), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!rateLimit(`listing:${session.sub}`, 6, 60_000)) throw Errors.rateLimited();

    const body = listingSubmitSchema.parse(await req.json());
    await connectDB();

    if (body.logo) {
      const logo = await PlateLogo.findById(body.logo).select("isActive");
      if (!logo || !logo.isActive) throw Errors.badRequest("شعار اللوحة المحدد غير متاح");
    }
    if (body.category) {
      const category = await PlateCategory.findById(body.category).select("isActive");
      if (!category || !category.isActive) throw Errors.badRequest("تصنيف اللوحة المحدد غير متاح");
    }

    const { ownershipDocument, contactEmail, ...rest } = body;

    // Every user submission enters review as "pending", whatever its
    // submission type: a marketplace listing is no more self-evidently
    // legitimate than an auction request, and nothing a user creates may
    // reach the public site before a moderator acts on it. Only the
    // staff-only moderate endpoint moves a listing out of this state.
    const plate = await Plate.create({
      ...rest,
      contactEmail: contactEmail || null,
      ownershipDocument: ownershipDocument ?? null,
      ownerUser: session.sub,
      createdBy: session.sub,
      moderationStatus: "pending",
      isVisible: true,
    });

    await AuditLog.create({
      actor: session.sub,
      action: "listing.submitted",
      entityType: "Plate",
      entityId: plate._id,
      metadata: { submissionType: body.submissionType, title: body.title },
    });

    return jsonOk({ _id: String(plate._id) }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
