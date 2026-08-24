import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { getUserPlates, getPlateAuctionIndex } from "@/lib/accountQueries";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { MyListingCard, type ListingAuctionLink } from "@/components/plate/MyListingCard";
import { cn } from "@/lib/cn";
import type { AuctionStatus } from "@/lib/constants";

export const revalidate = 0;

const IN_AUCTION_STATUSES: AuctionStatus[] = ["draft", "scheduled", "live"];
const SOLD_STATUSES: AuctionStatus[] = ["sold", "purchased"];

type Bucket = "pending" | "inAuction" | "sold" | "inactive";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * "لوحاتي" — rebuilt to match the production card-grid layout (status
 * tabs + plate-render cards) rather than the flat list this page used to
 * be. Bucketing is derived from real data, never a separate stored field:
 * a listing's bucket is a function of its moderation status and its most
 * recent linked Auction's status (see classify() below), computed once
 * per request from the same Plate/Auction records every other page reads.
 *
 * Data comes from getUserPlates/getPlateAuctionIndex — the same queries
 * /account/plates uses — so this page (now the "لوحاتي" nav destination)
 * shows exactly the same set of plates that page did, just in this
 * card-grid-with-tabs layout instead.
 */
export default async function MyListingsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const { t, locale } = await getServerTranslator();

  const listings = await getUserPlates(session.sub);
  const canCreateAuction = hasPermission(session, "auction:create");
  const plateIds = listings.map((l) => l._id);

  const auctionIndex = await getPlateAuctionIndex(plateIds);
  const auctionByPlate = new Map<string, ListingAuctionLink>();
  for (const [plateId, auction] of auctionIndex) {
    auctionByPlate.set(plateId, {
      auctionId: auction._id,
      status: auction.status as AuctionStatus,
      currentPrice: auction.currentPrice,
      finalPrice: auction.finalPrice,
    });
  }

  // "One active auction per plate" — same check POST /api/auctions
  // enforces server-side; here it only decides whether to *show* the
  // create-auction action, never trusted as authorization.
  const activeAuctionPlateIds = new Set(
    [...auctionByPlate.entries()].filter(([, a]) => IN_AUCTION_STATUSES.includes(a.status)).map(([id]) => id)
  );

  function classify(listing: (typeof listings)[number]): Bucket {
    if (listing.moderationStatus === "pending") return "pending";
    const auction = auctionByPlate.get(listing._id);
    if (auction && IN_AUCTION_STATUSES.includes(auction.status)) return "inAuction";
    if (auction && SOLD_STATUSES.includes(auction.status)) return "sold";
    return "inactive";
  }

  const buckets = listings.map((listing) => ({ listing, bucket: classify(listing) }));
  const counts: Record<Bucket, number> = { pending: 0, inAuction: 0, sold: 0, inactive: 0 };
  for (const { bucket } of buckets) counts[bucket] += 1;

  const activeTab = (tab === "pending" || tab === "inAuction" || tab === "sold" || tab === "inactive") ? tab : "all";
  const visible = activeTab === "all" ? buckets : buckets.filter((b) => b.bucket === activeTab);

  const tabs: { key: "all" | Bucket; label: string; count: number }[] = [
    { key: "all", label: t("pages.myListingsAllTab"), count: listings.length },
    { key: "pending", label: t("pages.myListingsPendingTab"), count: counts.pending },
    { key: "inAuction", label: t("pages.myListingsInAuctionTab"), count: counts.inAuction },
    { key: "sold", label: t("pages.myListingsSoldTab"), count: counts.sold },
    { key: "inactive", label: t("pages.myListingsInactiveTab"), count: counts.inactive },
  ];

  return (
    <div className="mz-container max-w-6xl py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("pages.myListingsTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("pages.myListingsSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/my-purchases" variant="secondary" size="sm">
            {t("pages.myPurchasesTitle")}
          </LinkButton>
          <LinkButton href="/plates/new" variant="gold" size="sm">
            {t("pages.addPlateTitle")}
          </LinkButton>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-(--color-border) pb-3">
        {tabs.map((tabItem) => (
          <Link
            key={tabItem.key}
            href={tabItem.key === "all" ? "/my-listings" : `/my-listings?tab=${tabItem.key}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-(--radius-pill) px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeTab === tabItem.key
                ? "bg-(--color-gold) text-(--color-gold-foreground)"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            )}
          >
            {tabItem.label}
            <span className="tnum text-xs opacity-80">{tabItem.count}</span>
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t("pages.noListingsYet")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ listing }) => {
            const auction = auctionByPlate.get(listing._id);
            const hasActiveAuction = activeAuctionPlateIds.has(listing._id);
            const createAuctionAction = !canCreateAuction
              ? null
              : listing.moderationStatus !== "approved"
                ? { kind: "blocked" as const, reason: t("pages.auctionBlockedNotApproved") }
                : !listing.isVisible
                  ? { kind: "blocked" as const, reason: t("pages.auctionBlockedHidden") }
                  : hasActiveAuction
                    ? { kind: "blocked" as const, reason: t("pages.auctionBlockedActiveExists") }
                    : { kind: "link" as const };

            return (
              <MyListingCard
                key={listing._id}
                listing={listing}
                auction={auction}
                createAuctionAction={createAuctionAction}
                locale={locale}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
