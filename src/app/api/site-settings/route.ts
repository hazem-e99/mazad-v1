import { NextRequest } from "next/server";
import { getSiteSettings, saveSiteSettings } from "@/lib/siteSettingsQueries";
import { siteSettingsSchema } from "@/lib/siteSettings";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

/**
 * Staff read of the settings record.
 *
 * Gated even though the values shape a public page: the public site never
 * comes through here — every public surface calls getSiteSettings()
 * directly on the server (see (public)/layout.tsx and the root layout) —
 * so the only caller of this route is the admin screen, and leaving it
 * open published the admin's whole settings document, contact details
 * and asset paths included, to anyone who guessed the URL.
 */
export async function GET() {
  try {
    await requirePermission("site_settings:view");
    const settings = await getSiteSettings();
    return jsonOk(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission("site_settings:manage");
    const body = await req.json();
    const payload = siteSettingsSchema.parse(body);
    const settings = await saveSiteSettings(payload);
    return jsonOk(settings);
  } catch (err) {
    return handleApiError(err);
  }
}
