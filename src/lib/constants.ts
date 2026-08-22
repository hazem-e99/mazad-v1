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
