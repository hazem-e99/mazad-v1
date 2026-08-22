import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerLocale } from "@/lib/i18n-server";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  unauthorized: () => new ApiError(401, "unauthorized", "يجب تسجيل الدخول للمتابعة"),
  forbidden: () => new ApiError(403, "forbidden", "ليس لديك صلاحية لتنفيذ هذا الإجراء"),
  notFound: (entity = "العنصر") => new ApiError(404, "not_found", `${entity} غير موجود`),
  conflict: (message: string) => new ApiError(409, "conflict", message),
  badRequest: (message: string) => new ApiError(400, "bad_request", message),
  rateLimited: () => new ApiError(429, "rate_limited", "عدد كبير من المحاولات، حاول لاحقًا"),
  internal: () => new ApiError(500, "internal_error", "حدث خطأ غير متوقع"),
};

// Generic, finite error codes are re-localized at the response boundary
// based on the request's locale cookie — this only touches the codes
// enumerated here (unauthorized/forbidden/rate_limited/validation_error/
// internal_error), which are stable across every call site, so the throw
// sites above never need to know the locale themselves. Free-form
// messages (Errors.conflict/badRequest, thrown deep in service code with
// business-specific text) are left as-authored — translating those would
// require threading a request-scoped locale through the entire service
// layer, a much larger change than this fixed, enumerable set.
const LOCALIZED_MESSAGES: Record<string, Record<"ar" | "en", string>> = {
  unauthorized: { ar: "يجب تسجيل الدخول للمتابعة", en: "You must sign in to continue" },
  forbidden: { ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء", en: "You do not have permission to perform this action" },
  rate_limited: { ar: "عدد كبير من المحاولات، حاول لاحقًا", en: "Too many attempts, please try again later" },
  validation_error: { ar: "بيانات غير صالحة", en: "Invalid data" },
  internal_error: { ar: "حدث خطأ غير متوقع", en: "Something went wrong" },
};

async function localize(code: string, fallback: string): Promise<string> {
  const entry = LOCALIZED_MESSAGES[code];
  if (!entry) return fallback;
  try {
    const locale = await getServerLocale();
    return entry[locale];
  } catch {
    return fallback;
  }
}

/**
 * Collapses a ZodError into { fieldPath: firstMessage }. Only the first
 * failure per field is kept — showing a user three cascading complaints
 * about one input is noise, and the first is always the most specific
 * reason the value was rejected.
 */
export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export async function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    const message = await localize(err.code, err.message);
    return NextResponse.json({ ok: false, code: err.code, message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const fieldErrors = fieldErrorsFromZod(err);
    // The top-level message is the first field's own reason rather than a
    // bare "invalid data", so even a client that only reads `message`
    // (or a toast) tells the user what actually went wrong.
    const first = Object.values(fieldErrors)[0];
    const message = first ?? (await localize("validation_error", "بيانات غير صالحة"));
    return NextResponse.json(
      { ok: false, code: "validation_error", message, fieldErrors, issues: err.issues },
      { status: 422 }
    );
  }
  const isProd = process.env.NODE_ENV === "production";
  console.error(err);
  const message = isProd ? await localize("internal_error", "حدث خطأ غير متوقع") : String(err);
  return NextResponse.json({ ok: false, code: "internal_error", message }, { status: 500 });
}
