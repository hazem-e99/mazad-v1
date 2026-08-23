import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";
import { PLATE_TYPES, PLATE_CLASSIFICATIONS, USAGE_TYPES, PLATE_SHAPES, PLATE_SIZES, SUBMISSION_TYPES, MODERATION_STATUSES } from "@/lib/constants";

const plateSchema = new Schema(
  {
    type: { type: String, enum: PLATE_TYPES, required: true },
    lettersAr: { type: String, required: true, trim: true, maxlength: 10 },
    lettersEn: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    numbers: { type: String, required: true, trim: true, maxlength: 4 },
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

    // ---- Independent classification dimensions (split out of the legacy
    // `type` enum above, which conflated usage/shape/classification; `type`
    // is kept for backward compatibility, these are the new source of
    // truth going forward). All nullable: a plate not yet migrated, or
    // created outside the marketplace/auction-request flow, simply has no
    // opinion on these axes. See server/migratePlateListingFields.ts.
    classification: { type: String, enum: PLATE_CLASSIFICATIONS, default: null },
    usageType: { type: String, enum: USAGE_TYPES, default: null },
    shape: { type: String, enum: PLATE_SHAPES, default: null },
    size: { type: String, enum: PLATE_SIZES, default: null },
    category: { type: Schema.Types.ObjectId, ref: "PlateCategory", default: null },

    // ---- Listing / marketplace fields. Plate doubles as "the listing" —
    // see AGENTS.md / IMPLEMENTATION_PROGRESS.md for why this wasn't split
    // into a separate model: Auction already references Plate directly, so
    // "create auction from an approved request" reuses this same document
    // with zero risk of ever duplicating the plate.
    title: { type: String, trim: true, maxlength: 150, default: null },
    description: { type: String, trim: true, maxlength: 2000, default: null },
    price: { type: Number, min: 0, default: null },
    // The actual uploaded photo of the physical plate — the platform never
    // generates plate artwork from letters/numbers/logo. SaudiPlate
    // remains a fallback only for records with no real photo yet.
    image: { type: String, default: null },

    // Private — never exposed in a public DTO, never under a public
    // /uploads/ URL. See src/lib/privateStorage.ts and
    // src/app/api/plates/[id]/ownership-document/route.ts.
    ownershipDocument: { type: String, default: null, select: false },

    contactPhone: { type: String, trim: true, default: null },
    contactEmail: { type: String, trim: true, lowercase: true, default: null },
    instagram: { type: String, trim: true, default: null },
    tiktok: { type: String, trim: true, default: null },
    snapchat: { type: String, trim: true, default: null },

    // null = not submitted through the marketplace/auction-request flow
    // (an admin-created or pre-existing plate) — never inferred from other
    // fields.
    submissionType: { type: String, enum: SUBMISSION_TYPES, default: null },
    // null = no moderation applicable (same legacy-plate case as above,
    // treated as implicitly visible for backward compatibility). A real
    // submission always starts at "pending".
    moderationStatus: { type: String, enum: MODERATION_STATUSES, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
  },
  { timestamps: true }
);

plateSchema.index({ type: 1 });
plateSchema.index({ isVip: 1, isVisible: 1 });
plateSchema.index({ numbers: 1, lettersEn: 1 });
plateSchema.index({ submissionType: 1, moderationStatus: 1 });
plateSchema.index({ classification: 1 });
plateSchema.index({ usageType: 1 });
plateSchema.index({ category: 1 });
plateSchema.index({ ownerUser: 1, createdAt: -1 });

export type PlateDoc = InferSchemaType<typeof plateSchema>;
export const Plate: Model<PlateDoc> = registerModel<PlateDoc>("Plate", plateSchema);
