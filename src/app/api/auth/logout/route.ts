import { clearSessionCookie } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
