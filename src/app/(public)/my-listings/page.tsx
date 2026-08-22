import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { toPlateDTOList, type LeanPlate } from "@/lib/dto";

export const revalidate = 0;

const statusTone: Record<string, "live" | "scheduled" | "sold" | "unsold" | "neutral"> = {
  pending: "scheduled",
  approved: "sold",
  rejected: "unsold",
};

export default async function MyListingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const { t, locale } = await getServerTranslator();

  const docs = await Plate.find({ ownerUser: session.sub, submissionType: { $ne: null } })
    .sort({ createdAt: -1 })
    .populate("logo")
    .populate("category")
    .lean<LeanPlate[]>();
  const listings = toPlateDTOList(docs);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
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

      {listings.length === 0 ? (
        <EmptyState title={t("pages.noListingsYet")} />
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <Card key={listing._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-20 w-32 shrink-0 rounded-(--radius-md) overflow-hidden bg-(--color-bg-elevated)">
                {listing.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-(--color-text) truncate">{listing.title ?? `${listing.lettersAr} ${listing.numbers}`}</p>
                  <Badge tone={statusTone[listing.moderationStatus ?? "pending"] ?? "neutral"}>
                    {t(`pages.moderationStatus_${listing.moderationStatus ?? "pending"}`)}
                  </Badge>
                  <Badge tone="neutral">
                    {listing.submissionType === "auction_request" ? t("pages.submissionTypeAuctionRequest") : t("pages.submissionTypeMarketplace")}
                  </Badge>
                  {listing.isVip && <Badge tone="vip">VIP</Badge>}
                </div>
                {listing.moderationStatus === "rejected" && listing.rejectionReason && (
                  <p className="text-xs text-(--color-danger) mt-1">{t("pages.rejectionReasonLabel")}: {listing.rejectionReason}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-(--color-text-faint) mt-1">
                  {listing.price != null && <span className="tnum">{formatSar(listing.price, locale)}</span>}
                  <span>{formatDateTime(listing.createdAt, locale)}</span>
                </div>
              </div>
              {listing.moderationStatus === "rejected" && (
                <Link href={`/plates/${listing._id}/edit`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover) whitespace-nowrap">
                  {t("pages.resubmitAction")}
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
