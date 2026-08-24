import type { PlateShape, PlateType, UsageType } from "@/lib/constants";
import type { PlateLogoDTO } from "@/types/dto";

/**
 * Central config for the "add a plate" wizard's dependency chain:
 * usage type -> shape -> logo. Keeping the rules here (rather than as
 * conditions scattered through PlateListingForm's JSX) is what lets a new
 * usage type or shape be wired in from one place.
 */

/**
 * Which physical stock a usage type can be cut from. A real-world call,
 * not sourced from the reference sheet like the accent colours: the small
 * square/sport stock is optional purchasable stock for private cars only,
 * never offered for taxis, commercial trucks, diplomatic or temporary
 * registrations, so those stay on the long strip.
 */
export const USAGE_TYPE_SHAPES: Record<UsageType, readonly PlateShape[]> = {
  private: ["wide", "small_square", "small_sport"],
  transport: ["wide"],
  private_transport: ["wide"],
  commercial: ["wide"],
  sport: ["wide", "small_sport"],
  diplomatic: ["wide"],
  temporary: ["wide"],
};

/**
 * Bridges the new usage type + shape choice back to the legacy `type`
 * field, which the Plate schema still requires (see plateSpec.ts's own
 * "legacy bridge" section). The wizard no longer shows `type` as a field
 * of its own, but the API/DB contract is unchanged, so a valid value must
 * still be derived and sent.
 */
export function deriveLegacyPlateType(usageType: UsageType | null, shape: PlateShape | null): PlateType {
  if (shape === "small_square") return "small_square";
  if (shape === "small_sport") return "small_sport";
  if (usageType === "transport") return "transfer";
  if (usageType === "sport") return "sport";
  return "private";
}

/**
 * Filters the admin-managed logo list down to what's actually valid for a
 * usage type + shape combination. A logo with an empty restriction array
 * on either axis is unrestricted on that axis — the default for every
 * logo created before this filtering existed, so nothing already in the
 * database loses visibility.
 */
export function getAllowedLogos(
  logos: PlateLogoDTO[] | null,
  usageType: UsageType | null,
  shape: PlateShape | null
): PlateLogoDTO[] | null {
  // `null` means "still loading" — distinct from "loaded, nothing allowed
  // yet" — so PlateLogoSelect can keep showing its loading state instead
  // of an empty list.
  if (!logos) return logos;
  return logos.filter((logo) => {
    const usageOk = logo.allowedUsageTypes.length === 0 || (usageType != null && logo.allowedUsageTypes.includes(usageType));
    const shapeOk = logo.allowedShapes.length === 0 || (shape != null && logo.allowedShapes.includes(shape));
    return usageOk && shapeOk;
  });
}
