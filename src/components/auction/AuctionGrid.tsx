import { AuctionCard } from "@/components/auction/AuctionCard";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

/**
 * The one auction grid. Every listing renders through this so card width,
 * gutter and breakpoints cannot drift between the all-auctions page, the
 * exclusive page and the account screens — which is exactly what happened
 * when each page inlined its own `repeat(auto-fit, …)` track.
 */
export function AuctionGrid({ auctions, className }: { auctions: AuctionSummary[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {auctions.map((auction) => (
        <AuctionCard key={auction._id} auction={auction} />
      ))}
    </div>
  );
}
