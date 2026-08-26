import { describe, it, expect } from "vitest";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  siteSettingsSchema,
} from "@/lib/siteSettings";

describe("Hero Background Settings & Normalization", () => {
  it("defaults to standard desktop and mobile hero backgrounds", () => {
    expect(DEFAULT_SITE_SETTINGS.hero.backgroundImage).toBe("/images/bg-hero.webp");
    expect(DEFAULT_SITE_SETTINGS.hero.mobileBackgroundImage).toBe("/images/bg-hero-mobile.png");
  });

  it("preserves dynamic custom desktop and mobile hero background uploaded by admin", () => {
    const desktopBg = "/api/site-assets/custom-hero-desktop.webp";
    const mobileBg = "/api/site-assets/custom-hero-mobile.webp";
    const normalized = normalizeSiteSettings({
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        backgroundImage: desktopBg,
        mobileBackgroundImage: mobileBg,
      },
    });

    expect(normalized.hero.backgroundImage).toBe(desktopBg);
    expect(normalized.hero.mobileBackgroundImage).toBe(mobileBg);
  });

  it("validates dynamic desktop and mobile hero background in siteSettingsSchema", () => {
    const desktopBg = "/uploads/site-assets/hero-desktop.png";
    const mobileBg = "/uploads/site-assets/hero-mobile.png";
    const parsed = siteSettingsSchema.parse({
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        backgroundImage: desktopBg,
        mobileBackgroundImage: mobileBg,
      },
    });

    expect(parsed.hero.backgroundImage).toBe(desktopBg);
    expect(parsed.hero.mobileBackgroundImage).toBe(mobileBg);
  });

  it("falls back to default hero backgrounds if undefined", () => {
    const normalized = normalizeSiteSettings({});
    expect(normalized.hero.backgroundImage).toBe(DEFAULT_SITE_SETTINGS.hero.backgroundImage);
    expect(normalized.hero.mobileBackgroundImage).toBe(DEFAULT_SITE_SETTINGS.hero.mobileBackgroundImage);
  });
});
