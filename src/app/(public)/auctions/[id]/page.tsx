import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Crown, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import { Bid } from "@/models/Bid";
import { User } from "@/models/User";
import "@/models/Plate";
import "@/models/PlateLogo";
import { getSession, hasPermission } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { BidPanel } from "@/components/auction/BidPanel";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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

  // Post-result contact reveal (spec: seller<->winner only, only after the
  // auction has a real result — never during live bidding, never for an
  // unsold auction with no counterparty). Resolved locally on this page
  // rather than threading a new populated field through every shared
  // auction query, to avoid touching unrelated call sites.
  const sellerId = auction.plate.ownerUser ?? auction.plate.createdBy;
  const isSeller = Boolean(session) && session!.sub === sellerId;
  const isWinner = Boolean(session) && auction.winner != null && session!.sub === auction.winner._id;
  const purchasedById = auctionDoc.purchasedBy ? String(auctionDoc.purchasedBy) : null;
  const isBuyer = Boolean(session) && purchasedById != null && session!.sub === purchasedById;

  let contactReveal: { label: string; phone: string | null; message: string } | null = null;
  if (auction.status === "sold" && auction.winner) {
    if (isSeller) contactReveal = { label: t("pages.contactWinnerLabel"), phone: auction.winner.phone || null, message: `${t("pages.contactWinnerLabel")} — ${auction.plate.lettersAr} ${auction.plate.numbers}` };
    else if (isWinner) contactReveal = { label: t("pages.contactSellerLabel"), phone: auction.plate.contactPhone, message: `${t("pages.contactSellerLabel")} — ${auction.plate.lettersAr} ${auction.plate.numbers}` };
  } else if (auction.status === "purchased" && purchasedById) {
    const buyer = await User.findById(purchasedById).select("name phone").lean<{ name: string; phone: string }>();
    if (isSeller && buyer) contactReveal = { label: t("pages.contactWinnerLabel"), phone: buyer.phone, message: `${t("pages.contactWinnerLabel")} — ${auction.plate.lettersAr} ${auction.plate.numbers}` };
    else if (isBuyer) contactReveal = { label: t("pages.contactSellerLabel"), phone: auction.plate.contactPhone, message: `${t("pages.contactSellerLabel")} — ${auction.plate.lettersAr} ${auction.plate.numbers}` };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <Link
        href="/auctions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-muted) hover:text-(--color-text) mb-5"
      >
        <Arrow className="h-4 w-4" aria-hidden="true" />
        {t("auction.backToAuctions")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
        <div className="flex flex-col gap-5">
          <div
            className={
              "relative flex items-center justify-center overflow-hidden rounded-(--radius-lg) border p-10 sm:p-14 bg-cover bg-center " +
              (isVip ? "border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow)" : "border-(--color-border) bg-(--color-bg-elevated)")
            }
            style={auction.backgroundImage ? { backgroundImage: `url(${auction.backgroundImage})` } : undefined}
          >
            {auction.backgroundImage && <div className="absolute inset-0 bg-black/45" aria-hidden="true" />}
            {!auction.backgroundImage && isVip && (
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_65%)]"
                aria-hidden="true"
              />
            )}
            <div className="relative flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-1.5">
                {isVip && (
                  <Badge tone="vip" className="gap-1">
                    <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                    {t("auction.vipBadge")}
                  </Badge>
                )}
                {auction.category === "exclusive" && (
                  <Badge tone="gold" className="gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                    {t("auction.exclusiveBadge")}
                  </Badge>
                )}
              </div>
              <div className="flex w-full items-center justify-center overflow-hidden rounded-(--radius-md) bg-(--color-bg)/70">
                {auction.plate.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={auction.plate.image}
                    alt={auction.plate.title ?? `${auction.plate.lettersAr} ${auction.plate.numbers}`}
                    className="max-h-[430px] w-full object-contain"
                  />
                ) : (
                  <PlateRenderer
                    type={auction.plate.type}
                    lettersAr={auction.plate.lettersAr}
                    lettersEn={auction.plate.lettersEn}
                    numbers={auction.plate.numbers}
                    logo={auction.plate.logo}
                    size="xl"
                    locale={locale}
                  />
                )}
              </div>
            </div>
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-(--color-text) mb-4">{t("auction.plateSpecs")}</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-sm">
              <div>
                <dt className="text-(--color-text-muted) mb-0.5">{plateTypeLabel(auction.plate.type, locale)}</dt>
                <dd className="text-(--color-text-faint) text-xs">{t("common.plate")}</dd>
              </div>
              {auction.plate.logo && (
                <div>
                  <dt className="text-(--color-text) font-medium mb-0.5">
                    {locale === "en" ? auction.plate.logo.nameEn : auction.plate.logo.nameAr}
                  </dt>
                  <dd className="text-(--color-text-faint) text-xs">{t("pages.plateLogoLabel")}</dd>
                </div>
              )}
              <div>
                <dt className="text-(--color-text) font-medium mb-0.5">
                  {auction.category === "exclusive" ? t("auction.exclusiveBadge") : t("admin.categoryRegular")}
                </dt>
                <dd className="text-(--color-text-faint) text-xs">{t("auction.category")}</dd>
              </div>
              <div>
                <dt className="tnum text-(--color-text) font-medium mb-0.5">{formatSar(auction.startingPrice, locale)}</dt>
                <dd className="text-(--color-text-faint) text-xs">{t("auction.startingPrice")}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="tnum text-(--color-text) font-medium mb-0.5">{formatDateTime(auction.createdAt, locale)}</dt>
                <dd className="text-(--color-text-faint) text-xs">{t("auction.listedOn")}</dd>
              </div>
            </dl>
          </Card>

          {contactReveal && (
            <Card className="p-5 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-(--color-text)">{contactReveal.label}</h2>
              <WhatsAppContactButton contactPhone={contactReveal.phone} message={contactReveal.message} />
            </Card>
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
