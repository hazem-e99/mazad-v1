import { Gavel, Crown, Search, Store } from "lucide-react";
import { getHomeAuctions, getVipPlates, getMarketplaceListings } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { ListingCard } from "@/components/plate/ListingCard";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

const CARD_GRID = "grid grid-cols-[repeat(auto-fit,minmax(260px,300px))] justify-center gap-4";

export default async function HomePage() {
  const [{ live, upcoming, recentlyCompleted }, vipPlates, marketplaceListings, { t, locale }] = await Promise.all([
    getHomeAuctions(),
    getVipPlates(8),
    getMarketplaceListings(6),
    getServerTranslator(),
  ]);

  const featured = live[0] ?? upcoming[0] ?? null;
  const featuredLabel = live[0] ? t("home.featuredNow") : upcoming[0] ? t("home.nextAuction") : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col gap-16">
      <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center pt-2 pb-4 lg:py-8">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl sm:text-5xl font-bold text-(--color-text) leading-[1.12] tracking-tight max-w-xl">
            {t("home.title")}
          </h1>
          <p className="text-lg text-(--color-text-muted) leading-relaxed max-w-lg">{t("home.subtitle")}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <LinkButton href="/auctions" variant="gold" size="lg">
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
              {t("home.browseAuctions")}
            </LinkButton>
            <LinkButton href="/vip" variant="secondary" size="lg">
              <Crown className="h-4.5 w-4.5" aria-hidden="true" />
              {t("home.vipPlates")}
            </LinkButton>
            <LinkButton href="/plates/new" variant="outline" size="lg">
              <Store className="h-4.5 w-4.5" aria-hidden="true" />
              {t("home.listYourPlate")}
            </LinkButton>
          </div>
          {(live.length > 0 || vipPlates.length > 0) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-(--color-text-muted)">
              {live.length > 0 && (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-live) opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-live)" />
                  </span>
                  <span className="tnum">{t("home.liveCountLabel", { count: live.length })}</span>
                </span>
              )}
              {vipPlates.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-(--color-gold)" aria-hidden="true" strokeWidth={2.25} />
                  <span className="tnum">{t("home.vipCountLabel", { count: vipPlates.length })}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          {featured ? (
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide px-1">
                {live[0] && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-live) opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-live)" />
                  </span>
                )}
                {featuredLabel}
              </span>
              <div className="max-w-sm mx-auto lg:mx-0 lg:ms-auto w-full">
                <AuctionCard auction={featured} />
              </div>
            </div>
          ) : vipPlates.length > 0 ? (
            <div className="relative flex items-center justify-center py-6">
              {vipPlates.slice(0, 3).map((p, i) => (
                <div
                  key={p._id}
                  className="absolute transition-transform"
                  style={{
                    transform: `translateX(${(i - 1) * 16}px) translateY(${i === 1 ? -10 : 6}px) rotate(${(i - 1) * 4}deg)`,
                    zIndex: i === 1 ? 3 : 1,
                  }}
                >
                  <Card className="border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow) p-5">
                    <PlateRenderer
                      type={p.type}
                      lettersAr={p.lettersAr}
                      lettersEn={p.lettersEn}
                      numbers={p.numbers}
                      logo={p.logo}
                      size="md"
                      locale={locale}
                    />
                  </Card>
                </div>
              ))}
              <div className="invisible">
                <Card className="p-5">
                  <PlateRenderer type="private" lettersAr="أ ب ج" lettersEn="ABC" numbers="1" logo={null} size="md" />
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <Gavel className="h-16 w-16 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.25} />
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.liveAuctions")} subtitle={t("home.liveAuctionsSubtitle")} href="/auctions?status=live" />
        {live.length > 0 ? (
          <div className={CARD_GRID}>
            {live.map((a) => (
              <AuctionCard key={a._id} auction={a} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Gavel}
            title={t("home.noLiveAuctions")}
            description={t("home.noLiveAuctionsHint")}
            action={
              <LinkButton href="/auctions" variant="secondary" size="sm">
                {t("home.browseAuctions")}
              </LinkButton>
            }
          />
        )}
      </section>

      <section>
        <SectionHeader title={t("home.vipPlates")} subtitle={t("home.vipPlatesSubtitle")} href="/vip" />
        {vipPlates.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {vipPlates.map((p) => (
              <Card
                key={p._id}
                className="shrink-0 flex items-center justify-center border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow) p-5"
              >
                <PlateRenderer
                  type={p.type}
                  lettersAr={p.lettersAr}
                  lettersEn={p.lettersEn}
                  numbers={p.numbers}
                  logo={p.logo}
                  size="md"
                  locale={locale}
                />
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={Crown} title={t("home.noVipPlates")} />
        )}
      </section>

      {marketplaceListings.length > 0 && (
        <section>
          <SectionHeader title={t("home.marketplaceListings")} subtitle={t("home.marketplaceListingsSubtitle")} href="/listings" />
          <div className={CARD_GRID}>
            {marketplaceListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t("home.upcomingAuctions")} subtitle={t("home.upcomingAuctionsSubtitle")} href="/auctions?status=scheduled" />
        {upcoming.length > 0 ? (
          <div className={CARD_GRID}>
            {upcoming.map((a) => (
              <AuctionCard key={a._id} auction={a} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Gavel} title={t("home.noUpcomingAuctions")} />
        )}
      </section>

      <section>
        <SectionHeader title={t("home.completedResults")} href="/auctions?status=sold" />
        {recentlyCompleted.length > 0 ? (
          <div className={CARD_GRID}>
            {recentlyCompleted.map((a) => (
              <AuctionCard key={a._id} auction={a} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Gavel} title={t("home.noResults")} />
        )}
      </section>
    </div>
  );
}
