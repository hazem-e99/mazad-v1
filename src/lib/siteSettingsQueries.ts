import { connectDB } from "@/lib/db";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteManagedPage,
  type SiteSettingsDTO,
} from "@/lib/siteSettings";
import { SiteSettings } from "@/models/SiteSettings";

type LeanSiteSettings = Partial<SiteSettingsDTO> & {
  _id?: unknown;
  updatedAt?: Date | string;
};

function toDTO(doc: LeanSiteSettings | null | undefined): SiteSettingsDTO {
  const normalized = normalizeSiteSettings(doc ?? null);
  return {
    ...normalized,
    _id: doc?._id ? String(doc._id) : undefined,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ singletonKey: "site" }).lean<LeanSiteSettings>();
    return toDTO(doc);
  } catch (err) {
    console.error("site settings failed to load; using defaults:", err);
    return normalizeSiteSettings(DEFAULT_SITE_SETTINGS);
  }
}

export async function saveSiteSettings(input: SiteSettingsDTO): Promise<SiteSettingsDTO> {
  await connectDB();
  const data = normalizeSiteSettings(input);
  const doc = await SiteSettings.findOneAndUpdate(
    { singletonKey: "site" },
    { $set: { ...data, singletonKey: "site" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<LeanSiteSettings>();
  return toDTO(doc);
}

export async function getManagedPageBySlug(slug: string): Promise<SiteManagedPage | null> {
  const settings = await getSiteSettings();
  return settings.pages.find((page) => page.enabled && page.slug === slug) ?? null;
}
