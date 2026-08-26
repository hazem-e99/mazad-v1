import { describe, it, expect } from "vitest";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  siteSettingsSchema,
} from "@/lib/siteSettings";

describe("Hero Background Settings & Normalization", () => {
  it("defaults to standard hero background", () => {
    expect(DEFAULT_SITE_SETTINGS.hero.backgroundImage).toBe("/images/bg-hero.webp");
  });

  it("preserves dynamic custom hero background uploaded by admin", () => {
    const customBg = "/api/site-assets/custom-hero-banner.webp";
    const normalized = normalizeSiteSettings({
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        backgroundImage: customBg,
      },
    });

    expect(normalized.hero.backgroundImage).toBe(customBg);
  });

  it("validates dynamic hero background in siteSettingsSchema", () => {
    const customBg = "/uploads/site-assets/hero-bg-2026.png";
    const parsed = siteSettingsSchema.parse({
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        backgroundImage: customBg,
      },
    });

    expect(parsed.hero.backgroundImage).toBe(customBg);
  });

  it("falls back to default hero background if undefined", () => {
    const normalized = normalizeSiteSettings({});
    expect(normalized.hero.backgroundImage).toBe(DEFAULT_SITE_SETTINGS.hero.backgroundImage);
  });
});
