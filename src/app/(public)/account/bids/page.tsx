import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { getUserBids, type UserBidEntry } from "@/lib/accountQueries";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { TabRail } from "@/components/account/TabRail";
import { EmptyState } from "@/components/layout/EmptyState";
import { Badge, type Tone } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatDateTime } from "@/lib/format";
import { isFinalStatus } from "@/lib/auctionStatus";

export const revalidate = 0;

type BidBucket = "winning" | "outbid" | "won" | "ended";

/**
 * Where a bid stands, from the viewer's point of view. The colour is the
 * message: green when they are ahead, red when they have been passed,
 * gold while it is still in play, grey once it is over (§27).
 */
function bucketFor(entry: UserBidEntry): BidBucket {
  if (entry.hasWon) return "won";
  if (isFinalStatus(entry.auction.status)) return "ended";
  return entry.isHighest ? "winning" : "outbid";
}

const bucketTone: Record<BidBucket, Tone> = {
  winning: "success",
  outbid: "danger",
  won: "success",
  ended: "neutral",
};

const bucketKey: Record<BidBucket, string> = {
  winning: "account.statusWinning",
  outbid: "account.statusOutbid",
  won: "account.statusWon",
  ended: "account.statusEnded",
};

export default async function AccountBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) notFound();

  const [{ tab = "all" }, entries, { t, locale }] = await Promise.all([
    searchParams,
    getUserBids(session.sub),
    getServerTranslator(),
  ]);

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const bucketed = entries.map((entry) => ({ ...entry, bucket: bucketFor(entry) }));
  const count = (key: BidBucket) => bucketed.filter((e) => e.bucket === key).length;
  const visible = tab === "all" ? bucketed : bucketed.filter((e) => e.bucket === tab);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{t("account.bidsTitle")}</h2>
        <p className="mt-1 text-sm text-(--color-text-muted)">{t("account.bidsSubtitle")}</p>
      </div>

      <TabRail
        label={t("account.bidsTitle")}
        tabs={[
          { key: "all", label: t("account.bidTabAll"), count: bucketed.length },
          { key: "winning", label: t("account.bidTabWinning"), count: count("winning") },
          { key: "outbid", label: t("account.bidTabOutbid"), count: count("outbid") },
          { key: "won", label: t("account.bidTabWon"), count: count("won") },
          { key: "ended", label: t("account.bidTabEnded"), count: count("ended") },
        ]}
      />

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {visible.map(({ auction, yourBid, bidAt, bucket }) => (
            <li key={auction._id}>
              <Link
                href={`/auctions/${auction._id}`}
                className="group flex flex-col gap-5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 transition-[border-color,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:border-(--color-gold)/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:flex-row sm:items-center"
              >
                <SaudiPlate
                  type={auction.plate.type}
                  lettersAr={auction.plate.lettersAr}
                  lettersEn={auction.plate.lettersEn}
                  numbers={auction.plate.numbers}
                  logo={auction.plate.logo}
                  size="sm"
                  vip={auction.plate.isVip}
                  locale={locale}
                />

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={bucketTone[bucket]}>{t(bucketKey[bucket])}</Badge>
                      <AuctionStatusBadge status={auction.status} />
                    </div>
                    <span className="tnum text-xs text-(--color-text-faint)">{formatDateTime(bidAt, locale)}</span>
                  </div>

                  <div className="flex items-end gap-6">
                    <PriceDisplay amount={yourBid} label={t("account.yourBid")} size="sm" tone="plain" />
                    <PriceDisplay
                      amount={
                        isFinalStatus(auction.status)
                          ? auction.finalPrice ?? auction.currentPrice
                          : auction.currentPrice
                      }
                      label={isFinalStatus(auction.status) ? t("auction.finalPrice") : t("auction.currentPrice")}
                      size="md"
                      tone={bucket === "won" ? "success" : "gold"}
                    />
                    <Arrow
                      className="mb-1 hidden h-4 w-4 shrink-0 text-(--color-text-faint) transition-colors group-hover:text-(--color-gold) sm:block"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title={t("account.noBids")}
          description={t("account.noBidsHint")}
          action={
            <LinkButton href="/auctions?status=live" variant="secondary" size="md">
              {t("home.browseAuctions")}
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
