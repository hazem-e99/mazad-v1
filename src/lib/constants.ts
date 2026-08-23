export const PLATE_TYPES = [
  "transfer", // لوحة نقل
  "individual", // لوحة فردي
  "private", // لوحة خصوصي
  "sport", // لوحة رياضية
  "wide", // لوحة عريضة
  "small_square", // لوحة مربعة صغيرة
  "small_sport", // لوحة رياضية صغيرة
] as const;
export type PlateType = (typeof PLATE_TYPES)[number];

export const PLATE_TYPE_LABELS_AR: Record<PlateType, string> = {
  transfer: "لوحة نقل",
  individual: "لوحة فردي",
  private: "لوحة خصوصي",
  sport: "لوحة رياضية",
  wide: "لوحة عريضة",
  small_square: "لوحة مربعة صغيرة",
  small_sport: "لوحة رياضية صغيرة",
};

export const PLATE_TYPE_LABELS_EN: Record<PlateType, string> = {
  transfer: "Transfer Plate",
  individual: "Individual Plate",
  private: "Private Plate",
  sport: "Sport Plate",
  wide: "Wide Plate",
  small_square: "Small Square Plate",
  small_sport: "Small Sport Plate",
};

export function plateTypeLabel(type: PlateType, locale: "ar" | "en" = "ar"): string {
  return locale === "en" ? PLATE_TYPE_LABELS_EN[type] : PLATE_TYPE_LABELS_AR[type];
}

// Plate logos are no longer a hardcoded enum — see src/models/PlateLogo.ts.
// The admin manages the list dynamically; a plate's `logo` is either an
// ObjectId reference to one of those records, or null for "no logo".

// Plate classification — an independent dimension from usage/shape/size.
// Legacy `type` conflated these; `individual` in PLATE_TYPES maps to
// "single" here during migration (see server/migratePlateListingFields.ts).
export const PLATE_CLASSIFICATIONS = ["single", "double", "triple", "quadruple"] as const;
export type PlateClassification = (typeof PLATE_CLASSIFICATIONS)[number];

export const PLATE_CLASSIFICATION_LABELS_AR: Record<PlateClassification, string> = {
  single: "فردي",
  double: "ثنائي",
  triple: "ثلاثي",
  quadruple: "رباعي",
};
export const PLATE_CLASSIFICATION_LABELS_EN: Record<PlateClassification, string> = {
  single: "Single",
  double: "Double",
  triple: "Triple",
  quadruple: "Quadruple",
};
export function plateClassificationLabel(value: PlateClassification, locale: "ar" | "en" = "ar"): string {
  return locale === "en" ? PLATE_CLASSIFICATION_LABELS_EN[value] : PLATE_CLASSIFICATION_LABELS_AR[value];
}

// Usage type — independent from classification/size/shape.
export const USAGE_TYPES = ["private", "transport", "private_transport", "sport"] as const;
export type UsageType = (typeof USAGE_TYPES)[number];

export const USAGE_TYPE_LABELS_AR: Record<UsageType, string> = {
  private: "خصوصي",
  transport: "نقل",
  private_transport: "نقل خاص",
  sport: "رياضية",
};
export const USAGE_TYPE_LABELS_EN: Record<UsageType, string> = {
  private: "Private",
  transport: "Transport",
  private_transport: "Private Transport",
  sport: "Sport",
};
export function usageTypeLabel(value: UsageType, locale: "ar" | "en" = "ar"): string {
  return locale === "en" ? USAGE_TYPE_LABELS_EN[value] : USAGE_TYPE_LABELS_AR[value];
}

// Plate shape — physical form factor, metadata only (never used to
// generate plate artwork).
export const PLATE_SHAPES = ["wide", "small_square", "small_sport"] as const;
export type PlateShape = (typeof PLATE_SHAPES)[number];

export const PLATE_SHAPE_LABELS_AR: Record<PlateShape, string> = {
  wide: "عريضة",
  small_square: "مربعة صغيرة",
  small_sport: "رياضية صغيرة",
};
export const PLATE_SHAPE_LABELS_EN: Record<PlateShape, string> = {
  wide: "Wide",
  small_square: "Small Square",
  small_sport: "Small Sport",
};
export function plateShapeLabel(value: PlateShape, locale: "ar" | "en" = "ar"): string {
  return locale === "en" ? PLATE_SHAPE_LABELS_EN[value] : PLATE_SHAPE_LABELS_AR[value];
}

// Plate size — physical dimensions, independent of shape (a real Saudi
// traffic-authority distinction: لوحة كبيرة / لوحة صغيرة).
export const PLATE_SIZES = ["large", "small"] as const;
export type PlateSize = (typeof PLATE_SIZES)[number];

export const PLATE_SIZE_LABELS_AR: Record<PlateSize, string> = { large: "كبيرة", small: "صغيرة" };
export const PLATE_SIZE_LABELS_EN: Record<PlateSize, string> = { large: "Large", small: "Small" };
export function plateSizeLabel(value: PlateSize, locale: "ar" | "en" = "ar"): string {
  return locale === "en" ? PLATE_SIZE_LABELS_EN[value] : PLATE_SIZE_LABELS_AR[value];
}

// How a submitted plate should be handled — set explicitly by the user at
// submission time, never inferred from URL/status/auction presence.
export const SUBMISSION_TYPES = ["marketplace", "auction_request"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

// Content-moderation workflow for a submitted listing — distinct from
// Plate.isVisible (a display toggle) and Auction.status (auction lifecycle).
export const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

// `rejected -> pending` is the owner's resubmission path (see the listing
// PATCH route); `rejected -> approved` lets a moderator reverse their own
// mistaken rejection without making the user resubmit unchanged data.
// Re-applying the status a listing already has is never a transition — it
// is rejected as a conflict so a double-clicked Approve can't silently
// overwrite a decision another moderator made in between.
export const MODERATION_TRANSITIONS: Record<ModerationStatus, ModerationStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: ["pending", "approved"],
};

export const AUCTION_CATEGORIES = ["regular", "exclusive"] as const;
export type AuctionCategory = (typeof AUCTION_CATEGORIES)[number];

export const AUCTION_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "ended",
  "sold",
  "unsold",
  "purchased",
  "cancelled",
] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

// Valid state transitions — backend is the sole source of truth for these.
// "ended" is intentionally a transient marker, not a real destination:
// live -> sold/unsold is computed and written atomically by
// finalizeAuction() (see auctionService.ts) so a result is never persisted
// without the winner/finalPrice fields that must accompany it. The generic
// status PATCH route rejects direct writes to "sold"/"unsold"/"ended" for
// this reason — use the dedicated end/finalize actions instead.
export const AUCTION_TRANSITIONS: Record<AuctionStatus, AuctionStatus[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["live", "cancelled"],
  live: ["sold", "unsold", "purchased", "cancelled"],
  ended: [],
  sold: [],
  unsold: [],
  purchased: [],
  cancelled: [],
};

export const USER_ROLES = ["user", "supervisor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "plate:create_featured", // إضافة لوحة مميزة
  "auction:create", // إضافة مزاد
  "auction:sell", // صلاحية البيع
  "auction:buy", // صلاحية الشراء
  "plate:manage",
  "plate_logo:manage", // إدارة شعارات اللوحات
  "category:manage", // إدارة تصنيفات اللوحات
  "listing:moderate", // مراجعة اللوحات المعروضة (قبول/رفض)
  "ownership_document:view", // الاطلاع على مستند إثبات الملكية
  "auction:manage",
  "user:manage",
  "vip:manage",
  "ad:manage",
  "upload:manage",
  "stats:view",
  "audit:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// Admins implicitly hold all permissions; supervisors hold only what's
// granted explicitly. Regular users get baseline bidding/purchase rights
// since those are ordinary consumer actions, not administrative ones.
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: ["auction:buy"],
  supervisor: [],
  admin: [...PERMISSIONS],
};

export const MIN_BID_INCREMENT = 50;
export const AUCTION_EXTENSION_WINDOW_SECONDS = 30;
export const AUCTION_EXTENSION_SECONDS = 60;

// Timestamps are stored in UTC, but the stats page buckets them into
// calendar days — and "today" has to mean what an admin in Saudi Arabia
// sees on the wall calendar, not what UTC says. Bids placed between
// midnight and 3am local would otherwise land on the previous day's bar.
// Riyadh observes no daylight saving, so this offset is fixed year-round.
export const STATS_TIMEZONE = "Asia/Riyadh";
export const STATS_TIMEZONE_OFFSET = "+03:00";
