import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PLATE_TYPES } from "@/lib/constants";

const plateSchema = new Schema(
  {
    type: { type: String, enum: PLATE_TYPES, required: true },
    lettersAr: { type: String, required: true, trim: true, maxlength: 10 },
    lettersEn: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    numbers: { type: String, required: true, trim: true, maxlength: 4 },
    image: { type: String, default: null },
    // Admin-managed, dynamic — see the PlateLogo model. `null` means "no
    // logo" (a real, permanent option, not a placeholder for "not yet
    // migrated"), so it's never required and never falls back to a magic
    // string value the way the old enum's "none" did.
    logo: { type: Schema.Types.ObjectId, ref: "PlateLogo", default: null },
    isVip: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    ownerUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

plateSchema.index({ type: 1 });
plateSchema.index({ isVip: 1, isVisible: 1 });
plateSchema.index({ numbers: 1, lettersEn: 1 });

export type PlateDoc = InferSchemaType<typeof plateSchema>;
export const Plate: Model<PlateDoc> = models.Plate ?? model<PlateDoc>("Plate", plateSchema);
