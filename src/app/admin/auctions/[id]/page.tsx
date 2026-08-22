import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import "@/models/Plate";
import "@/models/User";
import "@/models/PlateLogo";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import { AuctionStatusActions } from "./AuctionStatusActions";
import { AuctionBackgroundUploader } from "./AuctionBackgroundUploader";
import type { AuctionStatus } from "@/lib/constants";
import { toAuctionDTO, toBidDTOList, type LeanAuction, type LeanBid } from "@/lib/dto";

export const revalidate = 0;

const statusTone: Record<string, "live" | "scheduled" | "sold" | "unsold" | "neutral"> = {
  draft: "neutral",
  scheduled: "scheduled",
  live: "live",
  ended: "unsold",
  sold: "sold",
  unsold: "unsold",
  purchased: "sold",
  cancelled: "neutral",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAuctionDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const auctionDoc = await Auction.findById(id)
    .populate({ path: "plate", populate: { path: "logo" } })
    .populate("highestBidder", "name phone")
    .populate("winner", "name phone")
    .lean<LeanAuction>();
  if (!auctionDoc) notFound();

  const bidDocs = await Bid.find({ auction: id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("user", "name phone")
    .lean<LeanBid[]>();

  const auction = toAuctionDTO(auctionDoc);
  const bids = toBidDTOList(bidDocs);

  const statusLabelMap: Record<string, string> = {
    draft: t("common.status"),
    scheduled: t("auction.scheduled"),
    live: t("auction.live"),
    ended: t("auction.ended"),
    sold: t("auction.sold"),
    unsold: t("auction.unsold"),
    purchased: t("auction.purchased"),
    cancelled: t("auction.cancelled"),
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.auctionDetailTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.auctionDetailSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody className="flex flex-col items-center gap-4">
            <PlateRenderer
              type={auction.plate.type}
              lettersAr={auction.plate.lettersAr}
              lettersEn={auction.plate.lettersEn}
              numbers={auction.plate.numbers}
              logo={auction.plate.logo}
              size="md"
              locale={locale}
            />
            <Badge tone={statusTone[auction.status] ?? "neutral"} dot={auction.status === "live"}>
              {statusLabelMap[auction.status] ?? auction.status}
            </Badge>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("admin.auctionInfoHeader")}</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("auction.currentPrice")}</span>
              <span className="tnum font-semibold">{formatSar(auction.currentPrice, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("admin.bidCountLabel")}</span>
              <span className="tnum">{auction.bidCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("auction.highestBidder")}</span>
              <span>{auction.highestBidder?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("auction.winner")}</span>
              <span>{auction.winner?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("admin.colStart")}</span>
              <span className="text-xs">{formatDateTime(auction.startAt, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("admin.colEnd")}</span>
              <span className="text-xs">{formatDateTime(auction.endAt, locale)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.statusManagementHeader")}</h2>
        </CardHeader>
        <CardBody>
          <AuctionStatusActions auctionId={auction._id} status={auction.status as AuctionStatus} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.backgroundHeader")}</h2>
        </CardHeader>
        <CardBody>
          <AuctionBackgroundUploader auctionId={auction._id} currentImage={auction.backgroundImage} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">
            {t("admin.recentBidsHeader")} ({bids.length})
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {bids.length === 0 ? (
            <p className="text-sm text-(--color-text-faint)">{t("admin.noBidsOnAuction")}</p>
          ) : (
            bids.map((bid) => (
              <div
                key={bid._id}
                className="flex items-center justify-between rounded-(--radius-sm) bg-(--color-bg-elevated) px-3 py-2 text-sm"
              >
                <span>{bid.user.name || "—"}</span>
                <span className="tnum font-medium">{formatSar(bid.amount, locale)}</span>
                <Badge tone={bid.accepted ? "sold" : "neutral"}>{bid.accepted ? t("common.accepted") : t("common.rejected")}</Badge>
                <span className="text-xs text-(--color-text-faint)">{formatDateTime(bid.createdAt, locale)}</span>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
