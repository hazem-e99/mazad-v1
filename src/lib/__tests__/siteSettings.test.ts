import { describe, it, expect } from "vitest";
import {
  siteSettingsSchema,
  normalizeSiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/siteSettings";

describe("siteSettingsSchema & normalizeSiteSettings", () => {
  it("accepts empty hero titles", () => {
    const settings = {
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        titleAr: "",
        titleEn: "",
      },
    };
    const parsed = siteSettingsSchema.parse(settings);
    expect(parsed.hero.titleAr).toBe("");
    expect(parsed.hero.titleEn).toBe("");
  });

  it("populates default contact fields when none provided", () => {
    const normalized = normalizeSiteSettings({});
    expect(normalized.contact).toBeDefined();
    expect(normalized.contact.phone).toBe("9200 12345");
    expect(normalized.contact.email).toBe("info@lawhati.sa");
    expect(normalized.contact.addressAr).toContain("الرياض");
  });

  it("preserves custom contact fields through normalization", () => {
    const normalized = normalizeSiteSettings({
      contact: {
        phone: "0501234567",
        email: "custom@mazad.sa",
        addressAr: "جدة - حي الروضة",
        addressEn: "Jeddah - Al Rawdah",
        workingHoursAr: "طوال أيام الأسبوع",
        workingHoursEn: "24/7",
      },
    });
    expect(normalized.contact.phone).toBe("0501234567");
    expect(normalized.contact.email).toBe("custom@mazad.sa");
    expect(normalized.contact.addressAr).toBe("جدة - حي الروضة");
    expect(normalized.contact.addressEn).toBe("Jeddah - Al Rawdah");
  });
});
