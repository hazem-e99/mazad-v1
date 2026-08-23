import Link from "next/link";
import { redirect } from "next/navigation";
import { Gavel, ShoppingCart } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import "@/models/User";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime, formatSar } from "@/lib/format";
import { PlatePhoto } from "@/components/plate/PlatePhoto";
import { toAuctionDTOList, type LeanAuction } from "@/lib/dto";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { WhatsAppContactButton } from "@/components/plate/WhatsAppContactButton";

export const revalidate = 0;

export default async function MyPurchasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const { t, locale } = await getServerTranslator();

  const docs = await Auction.find({
    status: { $in: ["sold", "purchased"] },
    $or: [{ winner: session.sub }, { purchasedBy: session.sub }],
  })
    .sort({ purchasedAt: -1, finalizedAt: -1, updatedAt: -1 })
    .populate({ path: "plate", populate: [{ path: "logo" }, { path: "category" }] })
    .populate("winner", "name phone")
    .lean<LeanAuction[]>();

  const auctions = toAuctionDTOList(docs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("pages.myPurchasesTitle")}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">{t("pages.myPurchasesSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/my-listings" variant="secondary" size="sm">
            {t("pages.myListingsTitle")}
          </LinkButton>
          <LinkButton href="/auctions" variant="gold" size="sm">
            {t("pages.auctionsTitle")}
          </LinkButton>
        </div>
      </div>

      {auctions.length === 0 ? (
        <EmptyState
          title={t("pages.noPurchasesYet")}
          description={t("pages.noPurchasesYetHint")}
          icon={ShoppingCart}
          action={
            <LinkButton href="/auctions" variant="gold" size="md">
              {t("home.browseAuctions")}
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {auctions.map((auction) => {
            const plate = auction.plate;
            const title = plate.title ?? `${plate.lettersAr} ${plate.numbers}`;
            const isDirectPurchase = auction.status === "purchased" || auction.purchasedBy === session.sub;
            const resultDate = auction.purchasedAt ?? auction.finalizedAt ?? auction.updatedAt;
            const message = `${t("pages.contactSellerLabel")} - ${title}`;

            return (
              <Card key={auction._id} className="overflow-hidden">
                <div className="grid grid-cols-1 gap-0 sm:grid-cols-[180px_1fr]">
                  <Link href={`/auctions/${auction._id}`} className="block bg-(--color-bg-elevated)">
                    <div className="aspect-[4/3] sm:h-full sm:aspect-auto">
                      <PlatePhoto
                        src={plate.image}
                        alt={title}
                        className="h-full w-full object-cover"
                        fallback={
                          <div className="flex h-full min-h-36 items-center justify-center px-4 text-center text-xs text-(--color-text-faint)">
                            {t("pages.noImage")}
                          </div>
                        }
                      />
                    </div>
                  </Link>

                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone={isDirectPurchase ? "sold" : "gold"} className="gap-1">
                            {isDirectPurchase ? <ShoppingCart className="h-3 w-3" aria-hidden="true" /> : <Gavel className="h-3 w-3" aria-hidden="true" />}
                            {isDirectPurchase ? t("auction.purchasedDirect") : t("auction.sold")}
                          </Badge>
                          {plate.isVip && <Badge tone="vip">VIP</Badge>}
                        </div>
                        <h2 className="truncate text-base font-semibold text-(--color-text)">{title}</h2>
                        <p className="mt-1 text-xs text-(--color-text-faint)">{formatDateTime(resultDate, locale)}</p>
                      </div>

                      <div className="sm:text-end">
                        <p className="text-xs text-(--color-text-muted)">{t("auction.finalPrice")}</p>
                        <p className="tnum text-xl font-bold text-(--color-gold)">
                          {formatSar(auction.finalPrice ?? auction.currentPrice, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <WhatsAppContactButton contactPhone={plate.contactPhone} message={message} />
                      <Link href={`/auctions/${auction._id}`} className="text-sm font-medium text-(--color-gold) hover:text-(--color-gold-hover)">
                        {t("auction.viewDetails")}
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
