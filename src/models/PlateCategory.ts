import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const plateCategorySchema = new Schema(
  {
    nameAr: { type: String, required: true, trim: true, maxlength: 100 },
    nameEn: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

plateCategorySchema.index({ isActive: 1, sortOrder: 1 });

export type PlateCategoryDoc = InferSchemaType<typeof plateCategorySchema>;
export const PlateCategory: Model<PlateCategoryDoc> =
  models.PlateCategory ?? model<PlateCategoryDoc>("PlateCategory", plateCategorySchema);
