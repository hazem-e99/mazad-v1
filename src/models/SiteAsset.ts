import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const siteAssetSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true, default: "image/webp" },
    originalName: { type: String, default: "" },
    size: { type: Number, required: true },
    // Which upload pipeline wrote this asset (e.g. "plates", "auction-backgrounds",
    // "site-assets") — kept only for admin/debug visibility, not read on the serve path.
    subdir: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SiteAssetDoc = InferSchemaType<typeof siteAssetSchema>;
export const SiteAsset: Model<SiteAssetDoc> = registerModel<SiteAssetDoc>("SiteAsset", siteAssetSchema);
