import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import "@/models/Plate";
import "@/models/User";
import "@/models/PlateLogo";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import { AuctionStatusActions } from "./AuctionStatusActions";
import { AuctionBackgroundUploader } from "./AuctionBackgroundUploader";
import { AuctionBackgroundModerationActions } from "./AuctionBackgroundModerationActions";
import type { AuctionStatus } from "@/lib/constants";
import { toAuctionDTO, toBidDTOList, type LeanAuction, type LeanBid } from "@/lib/dto";
import {
  LivePrice,
  LiveBidCount,
  LiveHighestBidder,
  LiveStatusBadge,
  LiveViewerCount,
  LiveEndAt,
  AdminRealtimeStatus,
} from "@/components/admin/LiveAuctionCells";
import { AdminLiveRefresher } from "@/components/admin/AdminLiveRefresher";

export const revalidate = 0;

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

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Keeps the server-rendered bid history and audit trail in step with
          the live figures above it. */}
      <AdminLiveRefresher />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.auctionDetailTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.auctionDetailSubtitle")}</p>
        </div>
        <AdminRealtimeStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody className="flex flex-col items-center gap-4">
            <SaudiPlate
              type={auction.plate.type}
              usageType={auction.plate.usageType}
              shape={auction.plate.shape}
              classification={auction.plate.classification}
              lettersAr={auction.plate.lettersAr}
              lettersEn={auction.plate.lettersEn}
              numbers={auction.plate.numbers}
              logo={auction.plate.logo}
              size="md"
              locale={locale}
            />
            <div className="flex items-center gap-2">
              <LiveStatusBadge auctionId={auction._id} status={auction.status as AuctionStatus} />
              {auction.status === "live" && <LiveViewerCount auctionId={auction._id} />}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("admin.auctionInfoHeader")}</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("auction.currentPrice")}</span>
              <LivePrice
                auctionId={auction._id}
                currentPrice={auction.currentPrice}
                finalPrice={auction.finalPrice}
                status={auction.status as AuctionStatus}
                locale={locale}
                className="font-semibold text-(--color-gold)"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("admin.bidCountLabel")}</span>
              <LiveBidCount auctionId={auction._id} bidCount={auction.bidCount} />
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-text-muted)">{t("auction.highestBidder")}</span>
              <LiveHighestBidder auctionId={auction._id} name={auction.highestBidder?.name} />
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
              <span className="text-xs">
                <LiveEndAt auctionId={auction._id} endAt={auction.endAt} locale={locale} />
              </span>
            </div>
            {auction.status === "live" && (
              <div className="flex justify-between border-t border-(--color-border) pt-2">
                <span className="text-(--color-text-muted)">{t("auction.timeRemaining")}</span>
                <LiveEndAt auctionId={auction._id} endAt={auction.endAt} locale={locale} countdown />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.statusManagementHeader")}</h2>
        </CardHeader>
        <CardBody>
          <AuctionStatusActions
            auctionId={auction._id}
            status={auction.status as AuctionStatus}
            currentPrice={auction.currentPrice}
            bidCount={auction.bidCount}
            highestBidderName={auction.highestBidder?.name ?? null}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.backgroundHeader")}</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <AuctionBackgroundUploader auctionId={auction._id} currentImage={auction.backgroundImage} />
          <AuctionBackgroundModerationActions
            auctionId={auction._id}
            status={auction.backgroundStatus}
            rejectionReason={auction.backgroundRejectionReason}
          />
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
