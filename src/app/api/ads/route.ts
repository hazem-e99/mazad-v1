import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Advertisement } from "@/models/Advertisement";
import { requireSession, getSession, hasPermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { Errors } from "@/lib/api";

const createAdSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  image: z.string().min(1, "الصورة مطلوبة"),
  price: z.number().min(0).optional(),
  contactPhone: z.string().trim().min(9).max(15),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const search = searchParams.get("search");
    const wantsAll = searchParams.get("all") === "true";

    const session = await getSession();
    const canModerate = wantsAll && hasPermission(session, "ad:manage");

    const filter: Record<string, unknown> = canModerate ? {} : { isActive: true };
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    const isActiveParam = searchParams.get("isActive");
    if (canModerate && isActiveParam === "true") filter.isActive = true;
    else if (canModerate && isActiveParam === "false") filter.isActive = false;

    const [items, total] = await Promise.all([
      Advertisement.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Advertisement.countDocuments(filter),
    ]);

    return jsonOk({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!rateLimit(`ad:${session.sub}`, 10, 60_000)) throw Errors.rateLimited();

    const body = createAdSchema.parse(await req.json());
    await connectDB();

    const ad = await Advertisement.create({ ...body, createdBy: session.sub });
    return jsonOk(ad, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
