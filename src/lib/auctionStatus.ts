import type { AuctionStatus } from "@/lib/constants";
import type { Tone } from "@/components/ui/Badge";

/**
 * The single mapping from an auction's status to how it is presented.
 * Previously each of the public card, the admin table and the bid panel
 * kept its own copy of this map, so a new status (or a recoloured one)
 * had to be remembered in three places.
 */
export const statusTone: Record<AuctionStatus, Tone> = {
  draft: "neutral",
  scheduled: "scheduled",
  live: "live",
  ended: "unsold",
  sold: "sold",
  unsold: "unsold",
  purchased: "sold",
  cancelled: "danger",
};

/** Translation key for each status, resolved by the caller's `t`. */
export const statusKey: Record<AuctionStatus, string> = {
  draft: "auction.draft",
  scheduled: "auction.scheduled",
  live: "auction.live",
  ended: "auction.ended",
  sold: "auction.sold",
  unsold: "auction.unsold",
  purchased: "auction.purchased",
  cancelled: "auction.cancelled",
};

/** A status the auction can no longer move out of — price is final. */
export function isFinalStatus(status: AuctionStatus): boolean {
  return status === "sold" || status === "unsold" || status === "purchased" || status === "cancelled";
}

/** Left-edge accent colour, giving each state a distinct silhouette in a
 * grid without tinting the whole card. */
export const statusAccent: Record<AuctionStatus, string> = {
  draft: "bg-(--color-border-strong)",
  scheduled: "bg-(--color-scheduled)",
  live: "bg-(--color-live)",
  ended: "bg-(--color-border-strong)",
  sold: "bg-(--color-sold)",
  unsold: "bg-(--color-border-strong)",
  purchased: "bg-(--color-sold)",
  cancelled: "bg-(--color-danger)",
};
