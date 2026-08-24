import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "@/models/registerModel";
import { USER_ROLES, PERMISSIONS, USER_STATUSES } from "@/lib/constants";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Uniqueness is enforced by the partial indexes below (only among
    // non-deleted users) rather than an inline `unique: true` here, so a
    // soft-deleted user's phone/email can be reused by a new account.
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "user", required: true },
    permissions: { type: [String], enum: PERMISSIONS, default: [] },
    // Legacy binary flag — kept in sync with `status` (isActive =
    // status === "active") by the API routes that write it, for any older
    // code path still reading it. `status` is the field new code uses.
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: USER_STATUSES, default: "active" },
    // Soft delete: preserves historical bids/auctions/purchases that
    // reference this user's _id. `null` = not deleted.
    deletedAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null, email: { $type: "string" } } });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = registerModel<UserDoc>("User", userSchema);
