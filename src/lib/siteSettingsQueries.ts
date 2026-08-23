import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
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

const SITE_SETTINGS_TIMEOUT_MS = 5_000;
const SITE_SETTINGS_CACHE_TAG = "site-settings";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
      if (typeof timeout === "object" && "unref" in timeout) timeout.unref();
    }),
  ]);
}

function toDTO(doc: LeanSiteSettings | null | undefined): SiteSettingsDTO {
  const normalized = normalizeSiteSettings(doc ?? null);
  return {
    ...normalized,
    _id: doc?._id ? String(doc._id) : undefined,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsDTO> => {
    await withTimeout(connectDB(), SITE_SETTINGS_TIMEOUT_MS);
    const doc = await withTimeout(
      SiteSettings.findOne({ singletonKey: "site" }).lean<LeanSiteSettings>(),
      SITE_SETTINGS_TIMEOUT_MS
    );
    return toDTO(doc);
  },
  [SITE_SETTINGS_CACHE_TAG],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 300 }
);

export const getSiteSettings = cache(async (): Promise<SiteSettingsDTO> => {
  try {
    return await getCachedSiteSettings();
  } catch (err) {
    console.error("site settings failed to load; using defaults:", err);
    return normalizeSiteSettings(DEFAULT_SITE_SETTINGS);
  }
});

export async function saveSiteSettings(input: SiteSettingsDTO): Promise<SiteSettingsDTO> {
  await connectDB();
  const data = normalizeSiteSettings(input);
  const doc = await SiteSettings.findOneAndUpdate(
    { singletonKey: "site" },
    { $set: { ...data, singletonKey: "site" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<LeanSiteSettings>();
  revalidateTag(SITE_SETTINGS_CACHE_TAG, { expire: 0 });
  return toDTO(doc);
}

export async function getManagedPageBySlug(slug: string): Promise<SiteManagedPage | null> {
  const settings = await getSiteSettings();
  return settings.pages.find((page) => page.enabled && page.slug === slug) ?? null;
}
