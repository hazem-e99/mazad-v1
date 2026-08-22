import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const advertisementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    image: { type: String, required: true },
    linkUrl: { type: String, default: null },
    plate: { type: Schema.Types.ObjectId, ref: "Plate", default: null },
    price: { type: Number, default: null, min: 0 },
    contactPhone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

advertisementSchema.index({ isActive: 1, createdAt: -1 });

export type AdvertisementDoc = InferSchemaType<typeof advertisementSchema>;
export const Advertisement: Model<AdvertisementDoc> =
  models.Advertisement ?? model<AdvertisementDoc>("Advertisement", advertisementSchema);
