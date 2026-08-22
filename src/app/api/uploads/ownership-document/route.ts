import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { saveOwnershipDocument } from "@/lib/privateStorage";
import { jsonOk, handleApiError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Separate from /api/uploads: ownership/registration documents accept PDF
 * (which sharp cannot process) and are written to a private directory
 * outside `public/`, never returning a public URL — only an opaque
 * reference the caller stores on their Plate submission. The file itself
 * is only ever served back through the authorized
 * /api/plates/[id]/ownership-document route.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!rateLimit(`upload-doc:${session.sub}`, 10, 60_000)) throw Errors.rateLimited();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw Errors.badRequest("الملف مطلوب");

    let stored;
    try {
      stored = await saveOwnershipDocument(file, "ownership-documents");
    } catch (saveErr) {
      throw Errors.badRequest(saveErr instanceof Error ? saveErr.message : "تعذر معالجة الملف");
    }

    return jsonOk({ ref: stored.ref }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
