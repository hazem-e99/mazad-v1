import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";
import { USAGE_TYPES, PLATE_SHAPES } from "@/lib/constants";

const plateLogoSchema = new Schema(
  {
    nameAr: { type: String, required: true, trim: true, maxlength: 100 },
    nameEn: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    // Which usage types / shapes this logo may be offered for in the
    // add-plate picker. An empty array means "no restriction on this
    // axis" — the default, so every logo created before this field
    // existed stays visible everywhere it always was.
    allowedUsageTypes: { type: [String], enum: USAGE_TYPES, default: [] },
    allowedShapes: { type: [String], enum: PLATE_SHAPES, default: [] },
    // Set only by the one-time legacy-enum migration script, to make it
    // idempotent (re-running it must not create duplicate records for the
    // same legacy value). Never set by the admin CRUD flow.
    //
    // No `default` here deliberately: a sparse unique index only excludes
    // documents where the field is truly absent. Mongoose applying a
    // `default: null` would make every admin-created logo carry an
    // explicit `legacySlug: null`, which a sparse index still indexes —
    // colliding on the unique constraint after the very first one.
    legacySlug: { type: String, index: true, unique: true, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

plateLogoSchema.index({ isActive: 1, sortOrder: 1 });

export type PlateLogoDoc = InferSchemaType<typeof plateLogoSchema>;
export const PlateLogo: Model<PlateLogoDoc> = registerModel<PlateLogoDoc>("PlateLogo", plateLogoSchema);
