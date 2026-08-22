import { NextRequest } from "next/server";
import { requireSession, hasPermission } from "@/lib/auth";
import { saveImage } from "@/lib/storage";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

// Auction backgrounds are an administrative asset (spec section 20); ad and
// plate-submission photos are ordinary consumer uploads and only require
// authentication, not the upload:manage permission.
const ADMIN_ONLY_SUBDIRS = new Set(["auction-backgrounds"]);

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const formData = await req.formData();
    const file = formData.get("file");
    const subdir = String(formData.get("subdir") ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";

    if (ADMIN_ONLY_SUBDIRS.has(subdir) && !hasPermission(session, "upload:manage")) {
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
