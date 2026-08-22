import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const plateLogoSchema = new Schema(
  {
    nameAr: { type: String, required: true, trim: true, maxlength: 100 },
    nameEn: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    // Set only by the one-time legacy-enum migration script, to make it
    // idempotent (re-running it must not create duplicate records for the
    // same legacy value). Never set by the admin CRUD flow.
    legacySlug: { type: String, default: null, index: true, unique: true, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

plateLogoSchema.index({ isActive: 1, sortOrder: 1 });

export type PlateLogoDoc = InferSchemaType<typeof plateLogoSchema>;
export const PlateLogo: Model<PlateLogoDoc> = models.PlateLogo ?? model<PlateLogoDoc>("PlateLogo", plateLogoSchema);
