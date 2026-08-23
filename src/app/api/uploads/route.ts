import { NextRequest } from "next/server";
import { requireSession, hasPermission } from "@/lib/auth";
import { saveImage } from "@/lib/storage";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import type { Permission } from "@/lib/constants";

/**
 * Destinations that are administrative assets rather than consumer
 * uploads, each guarded by the permission that governs the thing the file
 * belongs to. Hiding the form is not a control — without this, any signed-in
 * user could POST artwork into a management folder.
 *
 * Anything not listed (ad images, plate-submission photos) is an ordinary
 * consumer upload and needs authentication only.
 */
const SUBDIR_PERMISSIONS: Record<string, Permission> = {
  "auction-backgrounds": "upload:manage",
  "plate-categories": "category:manage",
};

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const formData = await req.formData();
    const file = formData.get("file");
    const subdir = String(formData.get("subdir") ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";

    const requiredPermission = SUBDIR_PERMISSIONS[subdir];
    if (requiredPermission && !hasPermission(session, requiredPermission)) {
      throw Errors.forbidden();
    }

    if (!rateLimit(`upload:${session.sub}`, 20, 60_000)) throw Errors.rateLimited();
    if (!(file instanceof File)) throw Errors.badRequest("الملف مطلوب");

    let url: string;
    try {
      url = await saveImage(file, subdir);
    } catch (saveErr) {
      throw Errors.badRequest(saveErr instanceof Error ? saveErr.message : "تعذر معالجة الملف");
    }

    return jsonOk({ url }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
