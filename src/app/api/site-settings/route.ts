import { NextRequest } from "next/server";
import { getSiteSettings, saveSiteSettings } from "@/lib/siteSettingsQueries";
import { siteSettingsSchema } from "@/lib/siteSettings";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
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
