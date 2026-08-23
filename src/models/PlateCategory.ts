import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";

const plateCategorySchema = new Schema(
  {
    nameAr: { type: String, required: true, trim: true, maxlength: 100 },
    nameEn: { type: String, required: true, trim: true, maxlength: 100 },
    // Public URL to the artwork the home tiles draw (e.g.
    // "/api/site-assets/<uuid>.webp"), written by the shared upload
    // pipeline in src/lib/storage.ts — the bytes live in MongoDB, never here.
    // Optional on purpose: categories created before this field existed
    // keep working and fall back to the default icon.
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

plateCategorySchema.index({ isActive: 1, sortOrder: 1 });

export type PlateCategoryDoc = InferSchemaType<typeof plateCategorySchema>;
export const PlateCategory: Model<PlateCategoryDoc> = registerModel<PlateCategoryDoc>("PlateCategory", plateCategorySchema);
