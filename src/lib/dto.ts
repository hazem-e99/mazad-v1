import { Types } from "mongoose";
import { idToString, dateToISOString, nullableDateToISOString, isPopulated } from "@/lib/serialize";
import type {
  UserRefDTO,
  UserContactRefDTO,
  PlateLogoDTO,
  PlateCategoryDTO,
  PlateDTO,
  PlateListingDTO,
  AuctionDTO,
  BidDTO,
  PurchaseDTO,
  UserDTO,
  AdvertisementDTO,
  ChatMessageDTO,
  AuditLogDTO,
  BlockedWordDTO,
  ChatModerationLogDTO,
} from "@/types/dto";
import type { AuctionSummary, PlateSummary } from "@/types/auction";
import type {
  PlateType,
  UserRole,
  UserStatus,
  Permission,
  AuctionCategory,
  AuctionStatus,
  PlateClassification,
  UsageType,
  PlateShape,
  PlateSize,
  SubmissionType,
  ModerationStatus,
  BackgroundStatus,
  ChatViolationType,
  ChatModerationLogStatus,
} from "@/lib/constants";

/**
 * Mapper functions that convert `.lean()` query results (which still
 * contain real ObjectId/Date instances and, when populated, nested lean
 * subdocuments) into plain DTOs safe to pass across the Server Component /
 * Client Component boundary. Every page/query that will hand data to a
 * "use client" component should go through one of these rather than
 * casting with `as unknown as X`, which only satisfies the type checker
 * and leaves the actual runtime values untouched.
 *
 * Each `*Ref` field accepts either an unpopulated ObjectId or a populated
 * lean subdocument and normalizes both cases.
 */

// ---- shared ref helpers -----------------------------------------------

type ObjectIdLike = Types.ObjectId | string;

interface LeanUserRef {
  _id: ObjectIdLike;
  name: string;
}

function toUserRefDTO(user: LeanUserRef | ObjectIdLike | null | undefined): UserRefDTO | null {
  if (user == null) return null;
  if (isPopulated<LeanUserRef>(user as LeanUserRef)) {
    return { _id: idToString((user as LeanUserRef)._id), name: (user as LeanUserRef).name };
  }
  // Not populated — only the id is available; name is left empty rather
  // than guessed, so callers can tell an unpopulated ref from a real one.
  return { _id: idToString(user), name: "" };
}

interface LeanUserContactRef {
  _id: ObjectIdLike;
  name: string;
  phone?: string;
}

/** Like toUserRefDTO but also carries phone, for admin screens that show
 * contact info (auction highestBidder/winner detail view, audit log actor,
 * admin bids). `phone` is optional on the input because not every populate
 * call selects it — it comes back as "" rather than undefined so the DTO
 * stays a plain string field. */
function toUserContactRefDTO(user: LeanUserContactRef | ObjectIdLike | null | undefined): UserContactRefDTO | null {
  if (user == null) return null;
  if (isPopulated<LeanUserContactRef>(user as LeanUserContactRef)) {
    const u = user as LeanUserContactRef;
    return { _id: idToString(u._id), name: u.name, phone: u.phone ?? "" };
  }
  return { _id: idToString(user), name: "", phone: "" };
}

function toIdOrNull(value: ObjectIdLike | { _id: ObjectIdLike } | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "object" && "_id" in value) return idToString(value._id);
  return idToString(value);
}

// ---- PlateLogo --------------------------------------------------------------

export interface LeanPlateLogo {
  _id: ObjectIdLike;
  nameAr: string;
  nameEn: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  allowedUsageTypes: UsageType[];
  allowedShapes: PlateShape[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toPlateLogoDTO(logo: LeanPlateLogo): PlateLogoDTO {
  return {
    _id: idToString(logo._id),
    nameAr: logo.nameAr,
    nameEn: logo.nameEn,
    image: logo.image,
    isActive: logo.isActive,
    sortOrder: logo.sortOrder,
    allowedUsageTypes: logo.allowedUsageTypes ?? [],
    allowedShapes: logo.allowedShapes ?? [],
    createdAt: dateToISOString(logo.createdAt),
    updatedAt: dateToISOString(logo.updatedAt),
  };
}

export function toPlateLogoDTOList(logos: LeanPlateLogo[]): PlateLogoDTO[] {
  return logos.map(toPlateLogoDTO);
}

// ---- PlateCategory --------------------------------------------------------------

export interface LeanPlateCategory {
  _id: ObjectIdLike;
  nameAr: string;
  nameEn: string;
  // Absent on documents written before the field existed, hence optional
  // here and normalised to null by the mapper below.
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toPlateCategoryDTO(category: LeanPlateCategory): PlateCategoryDTO {
  return {
    _id: idToString(category._id),
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    image: category.image ?? null,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: dateToISOString(category.createdAt),
    updatedAt: dateToISOString(category.updatedAt),
  };
}

export function toPlateCategoryDTOList(categories: LeanPlateCategory[]): PlateCategoryDTO[] {
  return categories.map(toPlateCategoryDTO);
}

// ---- Plate --------------------------------------------------------------

export interface LeanPlate {
  _id: ObjectIdLike;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  // Populated (LeanPlateLogo) when the query does `.populate("logo")`,
  // a raw ObjectId when it doesn't, or null/undefined for "no logo".
  logo?: LeanPlateLogo | ObjectIdLike | null;
  isVip: boolean;
  isFeatured: boolean;
  isVisible: boolean;
  // Populated (LeanUserContactRef) when the query does
  // `.populate("ownerUser", ...)`, a raw ObjectId when it doesn't.
  ownerUser?: LeanUserContactRef | ObjectIdLike | null;
  createdBy: ObjectIdLike;
  notes?: string | null;
  classification?: PlateClassification | null;
  usageType?: UsageType | null;
  shape?: PlateShape | null;
  size?: PlateSize | null;
  category?: LeanPlateCategory | ObjectIdLike | null;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  existingBidAmount?: number | null;
  registrationValid?: boolean | null;
  inspectionValid?: boolean | null;
  insuranceAvailable?: boolean | null;
  image?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  submissionType?: SubmissionType | null;
  moderationStatus?: ModerationStatus | null;
  rejectionReason?: string | null;
  // Only present when the query explicitly `.select("+ownershipDocument")`
  // — deliberately excluded from PlateDTO; see toPlateListingDTO below.
  ownershipDocument?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toPlateDTO(plate: LeanPlate): PlateDTO {
  return {
    _id: idToString(plate._id),
    type: plate.type,
    lettersAr: plate.lettersAr,
    lettersEn: plate.lettersEn,
    numbers: plate.numbers,
    image: plate.image ?? null,
    logo: plate.logo != null && isPopulated<LeanPlateLogo>(plate.logo as LeanPlateLogo) ? toPlateLogoDTO(plate.logo as LeanPlateLogo) : null,
    isVip: plate.isVip,
    isFeatured: plate.isFeatured,
    isVisible: plate.isVisible,
    // Always the id, whether or not the ref was populated — passing a
    // populated lean doc straight to idToString() would stringify the
    // whole object, which is how this silently produced "[object Object]"
    // on any screen that populated the owner.
    ownerUser: toIdOrNull(plate.ownerUser),
    owner:
      plate.ownerUser != null && isPopulated<LeanUserContactRef>(plate.ownerUser as LeanUserContactRef)
        ? toUserContactRefDTO(plate.ownerUser as LeanUserContactRef)
        : null,
    createdBy: idToString(plate.createdBy),
    notes: plate.notes ?? null,
    classification: plate.classification ?? null,
    usageType: plate.usageType ?? null,
    shape: plate.shape ?? null,
    size: plate.size ?? null,
    category:
      plate.category != null && isPopulated<LeanPlateCategory>(plate.category as LeanPlateCategory)
        ? toPlateCategoryDTO(plate.category as LeanPlateCategory)
        : null,
    title: plate.title ?? null,
    description: plate.description ?? null,
    price: plate.price ?? null,
    existingBidAmount: plate.existingBidAmount ?? null,
    registrationValid: plate.registrationValid ?? null,
    inspectionValid: plate.inspectionValid ?? null,
    insuranceAvailable: plate.insuranceAvailable ?? null,
    contactPhone: plate.contactPhone ?? null,
    contactEmail: plate.contactEmail ?? null,
    instagram: plate.instagram ?? null,
    tiktok: plate.tiktok ?? null,
    snapchat: plate.snapchat ?? null,
    submissionType: plate.submissionType ?? null,
    moderationStatus: plate.moderationStatus ?? null,
    rejectionReason: plate.rejectionReason ?? null,
    createdAt: dateToISOString(plate.createdAt),
    updatedAt: dateToISOString(plate.updatedAt),
  };
}

export function toPlateDTOList(plates: LeanPlate[]): PlateDTO[] {
  return plates.map(toPlateDTO);
}

/** Owner/admin view — adds ownership-document *presence* only. Requires the
 * source query to `.select("+ownershipDocument")` (it's `select: false` on
 * the schema by default); never spreads the raw path into the DTO. */
export function toPlateListingDTO(plate: LeanPlate): PlateListingDTO {
  return { ...toPlateDTO(plate), hasOwnershipDocument: Boolean(plate.ownershipDocument) };
}

export function toPlateListingDTOList(plates: LeanPlate[]): PlateListingDTO[] {
  return plates.map(toPlateListingDTO);
}

// ---- Auction --------------------------------------------------------------

export interface LeanAuction {
  _id: ObjectIdLike;
  plate: LeanPlate | ObjectIdLike;
  category: AuctionCategory;
  status: AuctionStatus;
  startingPrice: number;
  minIncrement: number;
  currentPrice: number;
  startAt: Date | string;
  endAt: Date | string;
  directPurchaseEnabled: boolean;
  directPurchasePrice?: number | null;
  backgroundImage?: string | null;
  backgroundStatus?: BackgroundStatus | null;
  backgroundRejectionReason?: string | null;
  highestBid?: ObjectIdLike | null;
  highestBidder?: LeanUserContactRef | ObjectIdLike | null;
  bidCount: number;
  winner?: LeanUserContactRef | ObjectIdLike | null;
  finalPrice?: number | null;
  finalizedAt?: Date | string | null;
  purchasedBy?: ObjectIdLike | null;
  purchasedAt?: Date | string | null;
  createdBy: ObjectIdLike;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Requires `plate` to already be populated (every read path that reaches a
 * client component needs the plate's details to render a card/plate
 * graphic) — throws early with a clear message rather than silently
 * producing a broken DTO if a caller forgets `.populate("plate")`.
 */
export function toAuctionDTO(auction: LeanAuction): AuctionDTO {
  if (!auction || !isPopulated<LeanPlate>(auction.plate as LeanPlate)) {
    const id = auction?._id ? idToString(auction._id) : "unknown";
    throw new Error(`toAuctionDTO: auction ${id} plate must be populated before mapping to a DTO`);
  }

  return {
    _id: idToString(auction._id),
    plate: toPlateDTO(auction.plate as LeanPlate),
    category: auction.category,
    status: auction.status,
    startingPrice: auction.startingPrice,
    minIncrement: auction.minIncrement,
    currentPrice: auction.currentPrice,
    startAt: dateToISOString(auction.startAt),
    endAt: dateToISOString(auction.endAt),
    directPurchaseEnabled: auction.directPurchaseEnabled,
    directPurchasePrice: auction.directPurchasePrice ?? null,
    backgroundImage: auction.backgroundImage ?? null,
    backgroundStatus: auction.backgroundStatus ?? null,
    backgroundRejectionReason: auction.backgroundRejectionReason ?? null,
    highestBid: toIdOrNull(auction.highestBid ?? null),
    highestBidder: toUserContactRefDTO(auction.highestBidder),
    bidCount: auction.bidCount,
    winner: toUserContactRefDTO(auction.winner),
    finalPrice: auction.finalPrice ?? null,
    finalizedAt: nullableDateToISOString(auction.finalizedAt ?? null),
    purchasedBy: toIdOrNull(auction.purchasedBy ?? null),
    purchasedAt: nullableDateToISOString(auction.purchasedAt ?? null),
    createdBy: idToString(auction.createdBy),
    version: auction.version,
    createdAt: dateToISOString(auction.createdAt),
    updatedAt: dateToISOString(auction.updatedAt),
  };
}

export function toAuctionDTOList(auctions: LeanAuction[]): AuctionDTO[] {
  const valid = (auctions ?? []).filter((a) => {
    if (!a || !isPopulated<LeanPlate>(a.plate as LeanPlate)) {
      const id = a?._id ? idToString(a._id) : "unknown";
      console.warn(`[toAuctionDTOList] Skipping orphaned auction ${id}: referenced plate is missing or unpopulated`);
      return false;
    }
    return true;
  });
  return valid.map(toAuctionDTO);
}

/**
 * Card-sized view of a plate: exactly the fields a public card draws.
 *
 * This is not a micro-optimisation. A server component that hands data to
 * a `"use client"` component serialises the whole object into the RSC
 * payload, so anything merely *unrendered* is still shipped to every
 * visitor — and the full PlateDTO carries the seller's phone, email and
 * social handles plus the moderation trail. Narrowing here means those
 * fields are not in the object to begin with.
 */
export function toPlateSummaryDTO(plate: LeanPlate): PlateSummary {
  return {
    _id: idToString(plate._id),
    type: plate.type,
    lettersAr: plate.lettersAr,
    lettersEn: plate.lettersEn,
    numbers: plate.numbers,
    logo:
      plate.logo != null && isPopulated<LeanPlateLogo>(plate.logo as LeanPlateLogo)
        ? toPlateLogoDTO(plate.logo as LeanPlateLogo)
        : null,
    isVip: plate.isVip,
    image: plate.image ?? null,
    title: plate.title ?? null,
  };
}

export function toPlateSummaryDTOList(plates: LeanPlate[]): PlateSummary[] {
  return plates.map(toPlateSummaryDTO);
}

/**
 * Auction + narrowed plate, for the public cards and the home stage.
 * Bidder/winner refs are reduced to a display name: the public rooms and
 * the public payload never carry contact details, only the staff feed
 * does (see realtimeEvents.ts `AdminEventExtras`).
 */
export function toAuctionSummaryDTO(auction: LeanAuction): AuctionSummary {
  if (!auction || !isPopulated<LeanPlate>(auction.plate as LeanPlate)) {
    const id = auction?._id ? idToString(auction._id) : "unknown";
    throw new Error(`toAuctionSummaryDTO: auction ${id} plate must be populated before mapping to a DTO`);
  }

  // Delegate first so the "plate must be populated" guard and every scalar
  // mapping stay defined in exactly one place; the wide plate/contact
  // fields are then replaced before anything leaves this function.
  const full = toAuctionDTO(auction);
  const publicRef = (ref: UserContactRefDTO | null): UserContactRefDTO | null =>
    ref && { _id: ref._id, name: ref.name, phone: "" };

  return {
    ...full,
    plate: toPlateSummaryDTO(auction.plate as LeanPlate),
    highestBidder: publicRef(full.highestBidder),
    winner: publicRef(full.winner),
  };
}

export function toAuctionSummaryDTOList(auctions: LeanAuction[]): AuctionSummary[] {
  const valid = (auctions ?? []).filter((a) => {
    if (!a || !isPopulated<LeanPlate>(a.plate as LeanPlate)) {
      const id = a?._id ? idToString(a._id) : "unknown";
      console.warn(`[toAuctionSummaryDTOList] Skipping orphaned auction ${id}: referenced plate is missing or unpopulated`);
      return false;
    }
    return true;
  });
  return valid.map(toAuctionSummaryDTO);
}

// ---- Bid --------------------------------------------------------------

export interface LeanBid {
  _id: ObjectIdLike;
  auction: ObjectIdLike | { _id: ObjectIdLike };
  user: LeanUserRef | ObjectIdLike;
  amount: number;
  accepted: boolean;
  rejectionReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toBidDTO(bid: LeanBid): BidDTO {
  // populate() returns null when the referenced User no longer exists
  // (deleted account, or a bid imported before that user). The bid itself
  // is still valid history, so it degrades to an anonymous entry rather
  // than throwing and taking the whole auction page down with it.
  const user = toUserRefDTO(bid.user) ?? { _id: "", name: "" };

  return {
    _id: idToString(bid._id),
    auction: toIdOrNull(bid.auction) ?? "",
    user,
    amount: bid.amount,
    accepted: bid.accepted,
    rejectionReason: bid.rejectionReason ?? null,
    createdAt: dateToISOString(bid.createdAt),
    updatedAt: dateToISOString(bid.updatedAt),
  };
}

export function toBidDTOList(bids: LeanBid[]): BidDTO[] {
  return bids.map(toBidDTO);
}

// ---- Purchase --------------------------------------------------------------

export interface LeanPurchase {
  _id: ObjectIdLike;
  auction: ObjectIdLike;
  buyer: ObjectIdLike;
  price: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toPurchaseDTO(purchase: LeanPurchase): PurchaseDTO {
  return {
    _id: idToString(purchase._id),
    auction: idToString(purchase.auction),
    buyer: idToString(purchase.buyer),
    price: purchase.price,
    createdAt: dateToISOString(purchase.createdAt),
    updatedAt: dateToISOString(purchase.updatedAt),
  };
}

// ---- User --------------------------------------------------------------

export interface LeanUser {
  _id: ObjectIdLike;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  permissions?: Permission[];
  isActive: boolean;
  // Absent on documents written before the field existed — normalised to
  // "active" (its schema default) by the mapper below.
  status?: UserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toUserDTO(user: LeanUser): UserDTO {
  return {
    _id: idToString(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    permissions: user.permissions ?? [],
    isActive: user.isActive,
    status: user.status ?? (user.isActive ? "active" : "suspended"),
    createdAt: dateToISOString(user.createdAt),
    updatedAt: dateToISOString(user.updatedAt),
  };
}

export function toUserDTOList(users: LeanUser[]): UserDTO[] {
  return users.map(toUserDTO);
}

// ---- Advertisement --------------------------------------------------------------

export interface LeanAdvertisement {
  _id: ObjectIdLike;
  title: string;
  description?: string | null;
  image: string;
  linkUrl?: string | null;
  plate?: ObjectIdLike | null;
  price?: number | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdBy: ObjectIdLike;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toAdvertisementDTO(ad: LeanAdvertisement): AdvertisementDTO {
  return {
    _id: idToString(ad._id),
    title: ad.title,
    description: ad.description ?? null,
    image: ad.image,
    linkUrl: ad.linkUrl ?? null,
    plate: ad.plate ? idToString(ad.plate) : null,
    price: ad.price ?? null,
    contactPhone: ad.contactPhone ?? null,
    isActive: ad.isActive,
    createdBy: idToString(ad.createdBy),
    createdAt: dateToISOString(ad.createdAt),
    updatedAt: dateToISOString(ad.updatedAt),
  };
}

export function toAdvertisementDTOList(ads: LeanAdvertisement[]): AdvertisementDTO[] {
  return ads.map(toAdvertisementDTO);
}

// ---- ChatMessage --------------------------------------------------------------

export interface LeanChatMessage {
  _id: ObjectIdLike;
  user: LeanUserRef | ObjectIdLike;
  text: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toChatMessageDTO(message: LeanChatMessage): ChatMessageDTO {
  // Same reasoning as toBidDTO: a message whose author was deleted still
  // renders, attributed to nobody, instead of breaking the chat page.
  const user = toUserRefDTO(message.user) ?? { _id: "", name: "" };

  return {
    _id: idToString(message._id),
    user,
    text: message.text,
    createdAt: dateToISOString(message.createdAt),
    updatedAt: dateToISOString(message.updatedAt),
  };
}

export function toChatMessageDTOList(messages: LeanChatMessage[]): ChatMessageDTO[] {
  return messages.map(toChatMessageDTO);
}

// ---- AuditLog --------------------------------------------------------------

export interface LeanAuditLog {
  _id: ObjectIdLike;
  actor: LeanUserContactRef | ObjectIdLike | null;
  action: string;
  entityType: string;
  entityId: ObjectIdLike;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toAuditLogDTO(log: LeanAuditLog): AuditLogDTO {
  return {
    _id: idToString(log._id),
    actor: toUserContactRefDTO(log.actor),
    action: log.action,
    entityType: log.entityType,
    entityId: idToString(log.entityId),
    metadata: log.metadata ?? {},
    createdAt: dateToISOString(log.createdAt),
    updatedAt: dateToISOString(log.updatedAt),
  };
}

export function toAuditLogDTOList(logs: LeanAuditLog[]): AuditLogDTO[] {
  return logs.map(toAuditLogDTO);
}

// ---- BlockedWord --------------------------------------------------------------

export interface LeanBlockedWord {
  _id: ObjectIdLike;
  word: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toBlockedWordDTO(word: LeanBlockedWord): BlockedWordDTO {
  return {
    _id: idToString(word._id),
    word: word.word,
    isActive: word.isActive,
    createdAt: dateToISOString(word.createdAt),
    updatedAt: dateToISOString(word.updatedAt),
  };
}

export function toBlockedWordDTOList(words: LeanBlockedWord[]): BlockedWordDTO[] {
  return words.map(toBlockedWordDTO);
}

// ---- ChatModerationLog --------------------------------------------------------------

export interface LeanChatModerationLog {
  _id: ObjectIdLike;
  user: LeanUserContactRef | ObjectIdLike | null;
  auctionId?: ObjectIdLike | null;
  messageText: string;
  reason: string;
  violationType: ChatViolationType;
  matchedWords?: string[];
  status: ChatModerationLogStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toChatModerationLogDTO(log: LeanChatModerationLog): ChatModerationLogDTO {
  return {
    _id: idToString(log._id),
    user: toUserContactRefDTO(log.user),
    auctionId: log.auctionId ? idToString(log.auctionId) : null,
    messageText: log.messageText,
    reason: log.reason,
    violationType: log.violationType,
    matchedWords: log.matchedWords ?? [],
    status: log.status,
    createdAt: dateToISOString(log.createdAt),
    updatedAt: dateToISOString(log.updatedAt),
  };
}

export function toChatModerationLogDTOList(logs: LeanChatModerationLog[]): ChatModerationLogDTO[] {
  return logs.map(toChatModerationLogDTO);
}
