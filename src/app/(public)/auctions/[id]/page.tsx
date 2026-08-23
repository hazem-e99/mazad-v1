import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, MessageCircle } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import "@/models/Plate";
import "@/models/PlateLogo";
import { getSession, hasPermission } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { BidPanel } from "@/components/auction/BidPanel";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { VipBadge, ExclusiveBadge } from "@/components/ui/VipBadge";
import { plateTypeLabel } from "@/lib/constants";
import { formatSar, formatDateTime } from "@/lib/format";
import { toAuctionDTO, toBidDTOList, type LeanAuction, type LeanBid } from "@/lib/dto";
import { WhatsAppContactButton } from "@/components/plate/WhatsAppContactButton";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuctionDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();

  const auctionDoc = await Auction.findById(id)
    .populate({ path: "plate", populate: { path: "logo" } })
    .populate("highestBidder", "name")
    .populate("winner", "name phone")
    .lean<LeanAuction>();
  if (!auctionDoc) notFound();

  const [recentBidsDocs, session, { t, locale }] = await Promise.all([
    Bid.find({ auction: id, accepted: true }).sort({ createdAt: -1 }).limit(20).populate("user", "name").lean<LeanBid[]>(),
    getSession(),
    getServerTranslator(),
  ]);

  const auction = toAuctionDTO(auctionDoc);
  const recentBids = toBidDTOList(recentBidsDocs);
  const Arrow = locale === "ar" ? ArrowRight : ArrowLeft;
  const isVip = auction.plate.isVip;

  const sellerId = auction.plate.ownerUser ?? auction.plate.createdBy;
  const isSeller = Boolean(session) && session!.sub === sellerId;
  const isWinner = Boolean(session) && auction.winner != null && session!.sub === auction.winner._id;
  const purchasedById = auctionDoc.purchasedBy ? String(auctionDoc.purchasedBy) : null;
  const isBuyer = Boolean(session) && purchasedById != null && session!.sub === purchasedById;

  let contactReveal: { label: string; phone: string | null; message: string } | null = null;
  if (auction.status === "sold" && auction.winner) {
    if (isSeller) {
      contactReveal = {
        label: t("pages.contactWinnerLabel"),
        phone: auction.winner.phone || null,
        message: `${t("pages.contactWinnerLabel")} - ${auction.plate.lettersAr} ${auction.plate.numbers}`,
      };
    } else if (isWinner) {
      contactReveal = {
        label: t("pages.contactSellerLabel"),
        phone: auction.plate.contactPhone,
        message: `${t("pages.contactSellerLabel")} - ${auction.plate.lettersAr} ${auction.plate.numbers}`,
      };
    }
  } else if (auction.status === "purchased" && purchasedById) {
    const buyer = await User.findById(purchasedById).select("name phone").lean<{ name: string; phone: string }>();
    if (isSeller && buyer) {
      contactReveal = {
        label: t("pages.contactWinnerLabel"),
        phone: buyer.phone,
        message: `${t("pages.contactWinnerLabel")} - ${auction.plate.lettersAr} ${auction.plate.numbers}`,
      };
    } else if (isBuyer) {
      contactReveal = {
        label: t("pages.contactSellerLabel"),
        phone: auction.plate.contactPhone,
        message: `${t("pages.contactSellerLabel")} - ${auction.plate.lettersAr} ${auction.plate.numbers}`,
      };
    }
  }

  const specs = [
    { term: plateTypeLabel(auction.plate.type, locale), detail: t("pages.plateTypeLabel") },
    ...(auction.plate.logo
      ? [{ term: locale === "en" ? auction.plate.logo.nameEn : auction.plate.logo.nameAr, detail: t("pages.plateLogoLabel") }]
      : []),
    { term: auction.category === "exclusive" ? t("auction.exclusiveBadge") : t("admin.categoryRegular"), detail: t("auction.category") },
    { term: formatSar(auction.startingPrice, locale), detail: t("auction.startingPrice"), numeric: true },
    { term: formatSar(auction.minIncrement, locale), detail: t("auction.minIncrementLabel"), numeric: true },
    { term: formatDateTime(auction.createdAt, locale), detail: t("auction.listedOn"), numeric: true },
  ];

  return (
    <div className="mz-container py-8 sm:py-10">
      <Link
        href="/auctions"
        className="mb-6 inline-flex items-center gap-1.5 rounded-(--radius-sm) text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      >
        <Arrow className="h-4 w-4" aria-hidden="true" />
        {t("auction.backToAuctions")}
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:gap-10">
        <div className="flex flex-col gap-6">
          <div
            className={
              "relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-(--radius-xl) border bg-cover bg-center px-6 py-12 sm:py-16 " +
              (isVip
                ? "border-(--color-vip-border) bg-(--color-vip-surface)"
                : "border-(--color-border) bg-(--color-bg-elevated)")
            }
            style={auction.backgroundImage ? { backgroundImage: `url(${auction.backgroundImage})` } : undefined}
          >
            {auction.backgroundImage && <span className="absolute inset-0 bg-black/55" aria-hidden="true" />}

            <div className="relative flex flex-wrap items-center justify-center gap-1.5">
              <AuctionStatusBadge status={auction.status} />
              {isVip && <VipBadge />}
              {auction.category === "exclusive" && <ExclusiveBadge />}
            </div>

            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-(--radius-lg) bg-black/25 p-4">
              {/* Drawn from the record, never the uploaded photo. */}
              <SaudiPlate
                type={auction.plate.type}
                usageType={auction.plate.usageType}
                shape={auction.plate.shape}
                classification={auction.plate.classification}
                lettersAr={auction.plate.lettersAr}
                lettersEn={auction.plate.lettersEn}
                numbers={auction.plate.numbers}
                logo={auction.plate.logo}
                size="xl"
                vip={isVip}
                locale={locale}
              />
            </div>
          </div>

          <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
              <Info className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
              {t("auction.plateSpecs")}
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.detail} className="min-w-0">
                  <dt className={"truncate font-medium text-(--color-text) " + (spec.numeric ? "tnum" : "")}>{spec.term}</dt>
                  <dd className="mt-0.5 text-xs text-(--color-text-faint)">{spec.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          {contactReveal && (
            <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
                <MessageCircle className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                {contactReveal.label}
              </h2>
              <WhatsAppContactButton contactPhone={contactReveal.phone} message={contactReveal.message} />
            </section>
          )}
        </div>

        <BidPanel
          auction={auction}
          recentBids={recentBids}
          isAuthenticated={Boolean(session)}
          canBuy={hasPermission(session, "auction:buy")}
          currentUserId={session?.sub}
        />
      </div>
    </div>
  );
}
