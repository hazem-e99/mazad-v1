import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const siteLinkSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    labelAr: { type: String, required: true, trim: true, maxlength: 200 },
    labelEn: { type: String, required: true, trim: true, maxlength: 200 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const navItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    labelAr: { type: String, required: true, trim: true, maxlength: 200 },
    labelEn: { type: String, required: true, trim: true, maxlength: 200 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
    audience: { type: String, enum: ["always", "auth", "staff"], default: "always" },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const footerSectionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    titleAr: { type: String, required: true, trim: true, maxlength: 200 },
    titleEn: { type: String, required: true, trim: true, maxlength: 200 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    links: { type: [siteLinkSchema], default: [] },
  },
  { _id: false }
);

const socialLinkSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["whatsapp", "x", "instagram", "snapchat", "tiktok", "email", "facebook", "youtube", "link"],
      default: "link",
    },
    label: { type: String, required: true, trim: true, maxlength: 200 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const managedPageSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    titleAr: { type: String, required: true, trim: true, maxlength: 200 },
    titleEn: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    contentAr: { type: String, default: "", maxlength: 20000 },
    contentEn: { type: String, default: "", maxlength: 20000 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const siteSettingsSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: "site" },
    brand: {
      logoUrl: { type: String, required: true },
      headerLogoUrl: { type: String, required: true },
      footerLogoUrl: { type: String, required: true },
    },
    hero: {
      backgroundImage: { type: String, required: true },
      mobileBackgroundImage: { type: String, default: "" },
      logoUrl: { type: String, required: true },
      titleAr: { type: String, default: "", trim: true, maxlength: 200 },
      titleEn: { type: String, default: "", trim: true, maxlength: 200 },
    },
    seo: {
      siteNameAr: { type: String, required: true, trim: true, maxlength: 200 },
      siteNameEn: { type: String, required: true, trim: true, maxlength: 200 },
      titleAr: { type: String, required: true, trim: true, maxlength: 200 },
      titleEn: { type: String, required: true, trim: true, maxlength: 200 },
      descriptionAr: { type: String, required: true, trim: true, maxlength: 500 },
      descriptionEn: { type: String, required: true, trim: true, maxlength: 500 },
      keywordsAr: { type: String, default: "", trim: true, maxlength: 500 },
      keywordsEn: { type: String, default: "", trim: true, maxlength: 500 },
      canonicalUrl: { type: String, default: "", trim: true, maxlength: 500 },
      ogImage: { type: String, required: true },
      robotsIndex: { type: Boolean, default: true },
      robotsFollow: { type: Boolean, default: true },
    },
    contact: {
      phone: { type: String, default: "", trim: true, maxlength: 50 },
      email: { type: String, default: "", trim: true, lowercase: true, maxlength: 100 },
      addressAr: { type: String, default: "", trim: true, maxlength: 200 },
      addressEn: { type: String, default: "", trim: true, maxlength: 200 },
      workingHoursAr: { type: String, default: "", trim: true, maxlength: 200 },
      workingHoursEn: { type: String, default: "", trim: true, maxlength: 200 },
    },
    navItems: { type: [navItemSchema], default: [] },
    footer: {
      taglineAr: { type: String, default: "", maxlength: 200 },
      taglineEn: { type: String, default: "", maxlength: 200 },
      sections: { type: [footerSectionSchema], default: [] },
      socials: { type: [socialLinkSchema], default: [] },
      copyrightAr: { type: String, default: "", maxlength: 200 },
      copyrightEn: { type: String, default: "", maxlength: 200 },
    },
    pages: { type: [managedPageSchema], default: [] },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettings: Model<SiteSettingsDoc> = registerModel<SiteSettingsDoc>("SiteSettings", siteSettingsSchema);
