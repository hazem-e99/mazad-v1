import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("user:manage");
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    // Soft-deleted users are excluded from the default listing — an explicit
    // includeDeleted=true opts back in (not currently exposed in the admin
    // UI, but available for future use).
    if (searchParams.get("includeDeleted") !== "true") filter.deletedAt = null;
    if (role) filter.role = role;
    if (status) filter.status = status;
    else if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return jsonOk({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}
