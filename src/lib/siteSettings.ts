import { z } from "zod";

export type SiteAudience = "always" | "auth" | "staff";
export type SiteSocialPlatform = "whatsapp" | "x" | "instagram" | "snapchat" | "tiktok" | "email" | "facebook" | "youtube" | "link";

export interface SiteLink {
  id: string;
  labelAr: string;
  labelEn: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SiteNavItem extends SiteLink {
  audience: SiteAudience;
}

export interface SiteFooterSection {
  id: string;
  titleAr: string;
  titleEn: string;
  enabled: boolean;
  sortOrder: number;
  links: SiteLink[];
}

export interface SiteSocialLink {
  id: string;
  platform: SiteSocialPlatform;
  label: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SiteManagedPage {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  contentAr: string;
  contentEn: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SiteContactInfo {
  phone: string;
  email: string;
  addressAr: string;
  addressEn: string;
  workingHoursAr: string;
  workingHoursEn: string;
}

export interface SiteSettingsDTO {
  _id?: string;
  brand: {
    logoUrl: string;
    headerLogoUrl: string;
    footerLogoUrl: string;
  };
  hero: {
    backgroundImage: string;
    mobileBackgroundImage?: string;
    logoUrl: string;
    titleAr: string;
    titleEn: string;
  };
  seo: {
    siteNameAr: string;
    siteNameEn: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    keywordsAr: string;
    keywordsEn: string;
    canonicalUrl: string;
    ogImage: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
  };
  contact: SiteContactInfo;
  navItems: SiteNavItem[];
  footer: {
    taglineAr: string;
    taglineEn: string;
    sections: SiteFooterSection[];
    socials: SiteSocialLink[];
    copyrightAr: string;
    copyrightEn: string;
  };
  pages: SiteManagedPage[];
  updatedAt?: string;
}

const DEFAULT_LOGO = "/images/logo-mark.webp";
const DEFAULT_HERO = "/images/bg-hero.webp";
const DEFAULT_HERO_MOBILE = "/images/bg-hero-mobile.png";

export const DEFAULT_SITE_SETTINGS: SiteSettingsDTO = {
  brand: {
    logoUrl: DEFAULT_LOGO,
    headerLogoUrl: DEFAULT_LOGO,
    footerLogoUrl: DEFAULT_LOGO,
  },
  hero: {
    backgroundImage: DEFAULT_HERO,
    mobileBackgroundImage: DEFAULT_HERO_MOBILE,
    logoUrl: DEFAULT_LOGO,
    titleAr: "لوحتك تبدأ من هنا",
    titleEn: "Your plate starts here",
  },
  seo: {
    siteNameAr: "مزاد",
    siteNameEn: "Mazad",
    titleAr: "مزاد - سوق لوحات السيارات السعودية",
    titleEn: "Mazad - Saudi Vehicle Plates Marketplace",
    descriptionAr: "منصة مزادات للوحات السيارات المميزة في المملكة العربية السعودية",
    descriptionEn: "A marketplace for distinctive vehicle plates in Saudi Arabia.",
    keywordsAr: "مزاد لوحات, لوحات سيارات, لوحات مميزة, السعودية",
    keywordsEn: "plate auction, vehicle plates, Saudi plates, marketplace",
    canonicalUrl: "",
    ogImage: DEFAULT_HERO,
    robotsIndex: true,
    robotsFollow: true,
  },
  contact: {
    phone: "9200 12345",
    email: "info@lawhati.sa",
    addressAr: "الرياض - المملكة العربية السعودية",
    addressEn: "Riyadh - Kingdom of Saudi Arabia",
    workingHoursAr: "الأحد - الخميس 9 صباحاً - 10 مساءً",
    workingHoursEn: "Sun - Thu, 9am - 10pm",
  },
  navItems: [
    { id: "home", labelAr: "الرئيسية", labelEn: "Home", href: "/", audience: "always", enabled: true, sortOrder: 0 },
    { id: "auctions", labelAr: "المزادات", labelEn: "Auctions", href: "/auctions", audience: "always", enabled: true, sortOrder: 10 },
    { id: "marketplace", labelAr: "السوق", labelEn: "Marketplace", href: "/listings", audience: "always", enabled: true, sortOrder: 20 },
    { id: "exclusive", labelAr: "مزاد حصري", labelEn: "Exclusive", href: "/auctions/exclusive", audience: "always", enabled: true, sortOrder: 30 },
    { id: "vip", labelAr: "VIP", labelEn: "VIP", href: "/vip", audience: "always", enabled: true, sortOrder: 40 },
    { id: "my-plates", labelAr: "لوحاتي", labelEn: "My Plates", href: "/my-listings", audience: "auth", enabled: true, sortOrder: 50 },
    { id: "ads", labelAr: "الإعلانات", labelEn: "Ads", href: "/ads", audience: "always", enabled: true, sortOrder: 60 },
    { id: "chat", labelAr: "الدردشة", labelEn: "Chat", href: "/chat", audience: "always", enabled: true, sortOrder: 70 },
  ],
  footer: {
    taglineAr: "منصة مزاد للوحات السيارات المميزة في المملكة العربية السعودية.",
    taglineEn: "A marketplace for distinctive vehicle plates in Saudi Arabia.",
    copyrightAr: "جميع الحقوق محفوظة",
    copyrightEn: "All rights reserved",
    sections: [
      {
        id: "quick-links",
        titleAr: "روابط سريعة",
        titleEn: "Quick Links",
        enabled: true,
        sortOrder: 0,
        links: [
          { id: "footer-auctions", labelAr: "المزادات", labelEn: "Auctions", href: "/auctions", enabled: true, sortOrder: 0 },
          { id: "footer-exclusive", labelAr: "مزاد حصري", labelEn: "Exclusive", href: "/auctions/exclusive", enabled: true, sortOrder: 10 },
          { id: "footer-vip", labelAr: "VIP", labelEn: "VIP", href: "/vip", enabled: true, sortOrder: 20 },
          { id: "footer-ads", labelAr: "الإعلانات", labelEn: "Ads", href: "/ads", enabled: true, sortOrder: 30 },
          { id: "footer-chat", labelAr: "الدردشة", labelEn: "Chat", href: "/chat", enabled: true, sortOrder: 40 },
        ],
      },
      {
        id: "policies",
        titleAr: "السياسات",
        titleEn: "Policies",
        enabled: true,
        sortOrder: 10,
        links: [
          { id: "privacy", labelAr: "سياسة الخصوصية", labelEn: "Privacy Policy", href: "/pages/privacy", enabled: true, sortOrder: 0 },
        ],
      },
    ],
    socials: [
      { id: "whatsapp", platform: "whatsapp", label: "WhatsApp", href: "https://wa.me/", enabled: true, sortOrder: 0 },
      { id: "x", platform: "x", label: "X", href: "https://x.com/", enabled: true, sortOrder: 10 },
      { id: "instagram", platform: "instagram", label: "Instagram", href: "https://instagram.com/", enabled: true, sortOrder: 20 },
      { id: "email", platform: "email", label: "Email", href: "mailto:support@mazad.sa", enabled: true, sortOrder: 30 },
    ],
  },
  pages: [
    {
      id: "privacy",
      titleAr: "سياسة الخصوصية",
      titleEn: "Privacy Policy",
      slug: "privacy",
      contentAr: "اكتب سياسة الخصوصية الخاصة بالموقع من لوحة التحكم.",
      contentEn: "Write your privacy policy from the admin dashboard.",
      enabled: true,
      sortOrder: 0,
    },
  ],
};

const idSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/i);
const textSchema = z.string().trim().max(200);
const longTextSchema = z.string().trim().max(20000);
const hrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => value.startsWith("/") || /^(https?:|mailto:|tel:)/i.test(value), {
    message: "Invalid link",
  });
const imageUrlSchema = z.string().trim().min(1).max(500);
const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), { message: "Invalid URL" });
const sortOrderSchema = z.number().int().finite();
const enabledSchema = z.boolean().default(true);

const siteLinkSchema = z.object({
  id: idSchema,
  labelAr: textSchema.min(1),
  labelEn: textSchema.min(1),
  href: hrefSchema,
  enabled: enabledSchema,
  sortOrder: sortOrderSchema.default(0),
});

const siteNavItemSchema = siteLinkSchema.extend({
  audience: z.enum(["always", "auth", "staff"]).default("always"),
});

const footerSectionSchema = z.object({
  id: idSchema,
  titleAr: textSchema.min(1),
  titleEn: textSchema.min(1),
  enabled: enabledSchema,
  sortOrder: sortOrderSchema.default(0),
  links: z.array(siteLinkSchema).max(24).default([]),
});

const socialSchema = z.object({
  id: idSchema,
  platform: z.enum(["whatsapp", "x", "instagram", "snapchat", "tiktok", "email", "facebook", "youtube", "link"]),
  label: textSchema.min(1),
  href: hrefSchema,
  enabled: enabledSchema,
  sortOrder: sortOrderSchema.default(0),
});

const managedPageSchema = z.object({
  id: idSchema,
  titleAr: textSchema.min(1),
  titleEn: textSchema.min(1),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/i),
  contentAr: longTextSchema,
  contentEn: longTextSchema,
  enabled: enabledSchema,
  sortOrder: sortOrderSchema.default(0),
});

const contactSchema = z.object({
  phone: textSchema.default(""),
  email: textSchema.default(""),
  addressAr: textSchema.default(""),
  addressEn: textSchema.default(""),
  workingHoursAr: textSchema.default(""),
  workingHoursEn: textSchema.default(""),
});

export const siteSettingsSchema = z.object({
  brand: z.object({
    logoUrl: imageUrlSchema,
    headerLogoUrl: imageUrlSchema,
    footerLogoUrl: imageUrlSchema,
  }),
  hero: z.object({
    backgroundImage: imageUrlSchema,
    mobileBackgroundImage: imageUrlSchema.or(z.literal("")).optional().default(""),
    logoUrl: imageUrlSchema,
    titleAr: textSchema.default(""),
    titleEn: textSchema.default(""),
  }),
  seo: z.object({
    siteNameAr: textSchema.min(1),
    siteNameEn: textSchema.min(1),
    titleAr: textSchema.min(1),
    titleEn: textSchema.min(1),
    descriptionAr: z.string().trim().min(1).max(500),
    descriptionEn: z.string().trim().min(1).max(500),
    keywordsAr: z.string().trim().max(500),
    keywordsEn: z.string().trim().max(500),
    canonicalUrl: optionalUrlSchema,
    ogImage: imageUrlSchema,
    robotsIndex: z.boolean().default(true),
    robotsFollow: z.boolean().default(true),
  }),
  contact: contactSchema.default(DEFAULT_SITE_SETTINGS.contact),
  navItems: z.array(siteNavItemSchema).min(1).max(24),
  footer: z.object({
    taglineAr: textSchema,
    taglineEn: textSchema,
    sections: z.array(footerSectionSchema).max(12),
    socials: z.array(socialSchema).max(16),
    copyrightAr: textSchema,
    copyrightEn: textSchema,
  }),
  pages: z.array(managedPageSchema).max(40),
});

function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function optimizedKnownAsset(url: string): string {
  const replacements: Record<string, string> = {
    "/images/logo-mark.png": "/images/logo-mark.webp",
    "/images/bg-hero.png": "/images/bg-hero.webp",
  };
  return replacements[url] ?? url;
}

export function normalizeSiteSettings(input: Partial<SiteSettingsDTO> | null | undefined): SiteSettingsDTO {
  const merged = {
    ...DEFAULT_SITE_SETTINGS,
    ...(input ?? {}),
    brand: { ...DEFAULT_SITE_SETTINGS.brand, ...(input?.brand ?? {}) },
    hero: { ...DEFAULT_SITE_SETTINGS.hero, ...(input?.hero ?? {}) },
    seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(input?.seo ?? {}) },
    contact: { ...DEFAULT_SITE_SETTINGS.contact, ...(input?.contact ?? {}) },
    footer: { ...DEFAULT_SITE_SETTINGS.footer, ...(input?.footer ?? {}) },
    navItems: input?.navItems?.length ? input.navItems : DEFAULT_SITE_SETTINGS.navItems,
    pages: input?.pages ?? DEFAULT_SITE_SETTINGS.pages,
  };

  const parsed = siteSettingsSchema.parse(merged);
  return {
    ...parsed,
    brand: {
      logoUrl: optimizedKnownAsset(parsed.brand.logoUrl),
      headerLogoUrl: optimizedKnownAsset(parsed.brand.headerLogoUrl),
      footerLogoUrl: optimizedKnownAsset(parsed.brand.footerLogoUrl),
    },
    hero: {
      ...parsed.hero,
      backgroundImage: optimizedKnownAsset(parsed.hero.backgroundImage),
      mobileBackgroundImage: parsed.hero.mobileBackgroundImage ? optimizedKnownAsset(parsed.hero.mobileBackgroundImage) : "",
      logoUrl: optimizedKnownAsset(parsed.hero.logoUrl),
    },
    seo: {
      ...parsed.seo,
      ogImage: optimizedKnownAsset(parsed.seo.ogImage),
    },
    navItems: sortByOrder(parsed.navItems),
    footer: {
      ...parsed.footer,
      sections: sortByOrder(parsed.footer.sections).map((section) => ({
        ...section,
        links: sortByOrder(section.links),
      })),
      socials: sortByOrder(parsed.footer.socials),
    },
    pages: sortByOrder(parsed.pages),
  };
}

export function localizedText(locale: "ar" | "en", ar: string, en: string): string {
  return locale === "en" ? en || ar : ar || en;
}
