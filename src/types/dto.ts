import type {
  AuctionCategory,
  AuctionStatus,
  PlateType,
  UserRole,
  UserStatus,
  Permission,
  PlateClassification,
  UsageType,
  PlateShape,
  PlateSize,
  SubmissionType,
  ModerationStatus,
} from "@/lib/constants";

/**
 * Plain-object DTOs safe to pass from a Server Component into a "use
 * client" component or to serialize as JSON. Every field that would
 * otherwise be a Mongoose ObjectId or Date instance is narrowed to
 * `string` (ISO 8601 for dates) here — see src/lib/dto.ts for the mapper
 * functions that actually perform the conversion from a `.lean()` result.
 *
 * This is the single source of truth for these shapes; do not redeclare a
 * parallel "summary" type elsewhere — narrow with `Pick`/`Omit` from here
 * instead so the two can never drift out of sync.
 */

export interface UserRefDTO {
  _id: string;
  name: string;
}

/** A user ref that also carries the phone number — used where the UI needs
 * to show contact info (e.g. the audit log's actor column), distinct from
 * the plain UserRefDTO used for auction highestBidder/winner/bid.user. */
export interface UserContactRefDTO {
  _id: string;
  name: string;
  phone: string;
}

/** Admin-managed plate logo — see src/models/PlateLogo.ts. A plate with no
 * logo selected carries `logo: null` on PlateDTO, never a placeholder
 * record. */
export interface PlateLogoDTO {
  _id: string;
  nameAr: string;
  nameEn: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  /** Empty = unrestricted on that axis — see getAllowedLogos() in
   * src/lib/plateFormConfig.ts, the only place this filtering happens. */
  allowedUsageTypes: UsageType[];
  allowedShapes: PlateShape[];
  createdAt: string;
  updatedAt: string;
}

export interface PlateCategoryDTO {
  _id: string;
  nameAr: string;
  nameEn: string;
  /** Public path to the admin-uploaded artwork, or `null` for a category
   * that has none — the UI falls back to its default icon rather than
   * rendering a broken image. */
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlateDTO {
  _id: string;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  isVip: boolean;
  isFeatured: boolean;
  isVisible: boolean;
  ownerUser: string | null;
  /** The submitting user, name + phone, only when the source query
   * populated `ownerUser` (admin moderation screens). `null` everywhere
   * else — never a half-filled ref with an empty name. */
  owner: UserContactRefDTO | null;
  createdBy: string;
  notes: string | null;
  classification: PlateClassification | null;
  usageType: UsageType | null;
  shape: PlateShape | null;
  size: PlateSize | null;
  category: PlateCategoryDTO | null;
  title: string | null;
  description: string | null;
  price: number | null;
  /** "هل اللوحة مسيومة سابقاً؟" — an optional pre-existing offer amount for
   * an auction-request listing, shown as the current highest offer until a
   * real bid surpasses it. Only meaningful when submissionType is
   * "auction_request"; null otherwise. */
  existingBidAmount: number | null;
  /** Sale-readiness answers (§ Plate Sale Readiness). null = not answered
   * — legacy plates predating these fields. */
  registrationValid: boolean | null;
  inspectionValid: boolean | null;
  insuranceAvailable: boolean | null;
  image: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  instagram: string | null;
  tiktok: string | null;
  snapchat: string | null;
  submissionType: SubmissionType | null;
  moderationStatus: ModerationStatus | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Adds ownership-document *presence* (never the raw file path) — only for
 * the plate's owner or staff with `ownership_document:view`. Fetch the
 * actual file via the protected /api/plates/[id]/ownership-document route,
 * never from this DTO. */
export interface PlateListingDTO extends PlateDTO {
  hasOwnershipDocument: boolean;
}

export interface AuctionDTO {
  _id: string;
  plate: PlateDTO;
  category: AuctionCategory;
  status: AuctionStatus;
  startingPrice: number;
  minIncrement: number;
  currentPrice: number;
  startAt: string;
  endAt: string;
  directPurchaseEnabled: boolean;
  directPurchasePrice: number | null;
  backgroundImage: string | null;
  highestBid: string | null;
  highestBidder: UserContactRefDTO | null;
  bidCount: number;
  winner: UserContactRefDTO | null;
  finalPrice: number | null;
  finalizedAt: string | null;
  purchasedBy: string | null;
  purchasedAt: string | null;
  createdBy: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BidDTO {
  _id: string;
  auction: string;
  user: UserRefDTO;
  amount: number;
  accepted: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseDTO {
  _id: string;
  auction: string;
  buyer: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  _id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementDTO {
  _id: string;
  title: string;
  description: string | null;
  image: string;
  linkUrl: string | null;
  plate: string | null;
  price: number | null;
  contactPhone: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDTO {
  _id: string;
  user: UserRefDTO;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDTO {
  _id: string;
  actor: UserContactRefDTO | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
