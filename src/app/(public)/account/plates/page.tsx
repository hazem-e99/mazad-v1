import { notFound } from "next/navigation";
import { IdCard, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { getUserPlates, getPlateAuctionIndex } from "@/lib/accountQueries";
import { VipPlateCard } from "@/components/plate/VipPlateCard";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { TabRail } from "@/components/account/TabRail";
import { EmptyState } from "@/components/layout/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { isFinalStatus } from "@/lib/auctionStatus";
import type { PlateDTO } from "@/types/dto";
import type { AuctionSummary } from "@/types/auction";

export const revalidate = 0;

type PlateTab = "all" | "auction" | "review" | "sold" | "inactive";

/**
 * A plate's tab is derived from the auction attached to it, because the
 * Plate document itself has no lifecycle field — `isVisible` only says
 * whether staff have approved it for the public listings.
 */
function tabFor(plate: PlateDTO, auction: AuctionSummary | undefined): Exclude<PlateTab, "all"> {
  if (auction && (auction.status === "live" || auction.status === "scheduled")) return "auction";
  if (auction && (auction.status === "sold" || auction.status === "purchased")) return "sold";
  if (plate.moderationStatus === "pending" || plate.moderationStatus === "rejected") return "review";
  if (!plate.isVisible) return "review";
  return "inactive";
}

export default async function AccountPlatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) notFound();

  const [{ tab = "all" }, plates, { t, locale }] = await Promise.all([
    searchParams,
    getUserPlates(session.sub),
    getServerTranslator(),
  ]);

  const auctionIndex = await getPlateAuctionIndex(plates.map((p) => p._id));
  const classified = plates.map((plate) => ({ plate, auction: auctionIndex.get(plate._id) }));
  const bucketed = classified.map((entry) => ({ ...entry, bucket: tabFor(entry.plate, entry.auction) }));

  const count = (key: Exclude<PlateTab, "all">) => bucketed.filter((e) => e.bucket === key).length;
  const visible = tab === "all" ? bucketed : bucketed.filter((e) => e.bucket === tab);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{t("account.platesTitle")}</h2>
          <p className="mt-1 text-sm text-(--color-text-muted)">{t("account.platesSubtitle")}</p>
        </div>
        <LinkButton href="/plates/new" variant="gold" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("nav.addPlate")}
        </LinkButton>
      </div>

      <TabRail
        label={t("account.platesTitle")}
        tabs={[
          { key: "all", label: t("account.plateTabAll"), count: bucketed.length },
          { key: "auction", label: t("account.plateTabInAuction"), count: count("auction") },
          { key: "review", label: t("account.plateTabReview"), count: count("review") },
          { key: "sold", label: t("account.plateTabSold"), count: count("sold") },
          { key: "inactive", label: t("account.plateTabInactive"), count: count("inactive") },
        ]}
      />

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ plate, auction, bucket }) => (
            <VipPlateCard
              key={plate._id}
              plate={plate}
              href={auction ? `/auctions/${auction._id}` : undefined}
              footer={
                <div className="flex items-center justify-between gap-3">
                  {auction ? (
                    <>
                      <AuctionStatusBadge status={auction.status} />
                      <PriceDisplay
                        amount={
                          isFinalStatus(auction.status)
                            ? auction.finalPrice ?? auction.currentPrice
                            : auction.currentPrice
                        }
                        size="sm"
                        tone={auction.status === "sold" || auction.status === "purchased" ? "success" : "gold"}
                      />
                    </>
                  ) : (
                    <>
                      <Badge tone={bucket === "review" ? "info" : "neutral"}>
                        {bucket === "review" ? t("account.plateTabReview") : t("account.plateTabInactive")}
                      </Badge>
                      <span className="tnum text-xs text-(--color-text-faint)">
                        {new Date(plate.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                      </span>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={IdCard}
          title={t("account.noPlates")}
          description={t("account.noPlatesHint")}
          action={
            <LinkButton href="/plates/new" variant="secondary" size="md">
              {t("nav.addPlate")}
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
