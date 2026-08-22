import type { PlateDTO, AuctionDTO } from "@/types/dto";

/**
 * Narrower "card/list" views of the full DTOs, used by public-facing
 * components that only need a subset of fields. Derived from the DTO
 * types (not redeclared) so the two can never drift out of sync — any
 * mapper producing an AuctionDTO/PlateDTO is automatically assignable
 * here too.
 */
export type PlateSummary = Pick<
  PlateDTO,
  "_id" | "type" | "lettersAr" | "lettersEn" | "numbers" | "logo" | "isVip" | "image" | "title"
>;

export type AuctionSummary = Omit<AuctionDTO, "plate"> & { plate: PlateSummary };
