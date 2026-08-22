import { Types } from "mongoose";
import { idToString, dateToISOString, nullableDateToISOString, isPopulated } from "@/lib/serialize";
import type {
  UserRefDTO,
  UserContactRefDTO,
  PlateLogoDTO,
  PlateDTO,
  AuctionDTO,
  BidDTO,
  PurchaseDTO,
  UserDTO,
  AdvertisementDTO,
  ChatMessageDTO,
  AuditLogDTO,
} from "@/types/dto";
import type { PlateType, UserRole, Permission, AuctionCategory, AuctionStatus } from "@/lib/constants";

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
    createdAt: dateToISOString(logo.createdAt),
    updatedAt: dateToISOString(logo.updatedAt),
  };
}

export function toPlateLogoDTOList(logos: LeanPlateLogo[]): PlateLogoDTO[] {
  return logos.map(toPlateLogoDTO);
}

// ---- Plate --------------------------------------------------------------

export interface LeanPlate {
  _id: ObjectIdLike;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  image?: string | null;
  // Populated (LeanPlateLogo) when the query does `.populate("logo")`,
  // a raw ObjectId when it doesn't, or null/undefined for "no logo".
  logo?: LeanPlateLogo | ObjectIdLike | null;
  isVip: boolean;
  isFeatured: boolean;
  isVisible: boolean;
  ownerUser?: ObjectIdLike | null;
  createdBy: ObjectIdLike;
  notes?: string | null;
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
    ownerUser: plate.ownerUser ? idToString(plate.ownerUser) : null,
    createdBy: idToString(plate.createdBy),
    notes: plate.notes ?? null,
    createdAt: dateToISOString(plate.createdAt),
    updatedAt: dateToISOString(plate.updatedAt),
  };
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
  if (!isPopulated<LeanPlate>(auction.plate as LeanPlate)) {
    throw new Error("toAuctionDTO: auction.plate must be populated before mapping to a DTO");
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
  return auctions.map(toAuctionDTO);
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
  const user = toUserRefDTO(bid.user);
  if (!user) throw new Error("toBidDTO: bid.user must be populated before mapping to a DTO");

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
  const user = toUserRefDTO(message.user);
  if (!user) throw new Error("toChatMessageDTO: message.user must be populated before mapping to a DTO");

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
