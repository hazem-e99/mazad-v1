import { Gavel, Crown, CalendarClock, Trophy, Store } from "lucide-react";
import { getHomeAuctions, getVipPlates, getPlatformStats, getMarketplaceListings } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { ListingCard } from "@/components/plate/ListingCard";
import { VipPlateCard } from "@/components/plate/VipPlateCard";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { LiveAuctionSpotlight } from "@/components/home/LiveAuctionSpotlight";
import { StatsBand } from "@/components/home/StatsBand";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Carousel } from "@/components/ui/Carousel";
import { LinkButton } from "@/components/ui/Button";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";

export const revalidate = 0;

const CAROUSEL_ITEM = "mz-snap w-[min(19rem,78vw)] shrink-0";

function expandShowcase<T>(items: T[], target: number): T[] {
  if (items.length === 0) return [];
  if (items.length >= target) return items.slice(0, target);

  const expanded: T[] = [];
  for (let i = 0; i < target; i += 1) {
    expanded.push(items[i % items.length]);
  }
  return expanded;
}

export default async function HomePage() {
  const [{ live, upcoming, recentlyCompleted }, vipPlates, marketplaceListings, stats, { t }] = await Promise.all([
    getHomeAuctions(),
    getVipPlates(10),
    getMarketplaceListings(6),
    getPlatformStats(),
    getServerTranslator(),
  ]);

  const featured = live[0] ?? upcoming[0] ?? null;
  const vipShowcase = expandShowcase(vipPlates, 12);
  const upcomingShowcase = expandShowcase(upcoming, 12);
  const completedShowcase = expandShowcase(recentlyCompleted, 12);

  return (
    <>
      <Hero featured={featured} vipPlates={vipPlates} liveCount={live.length} />

      <div className="mz-container flex flex-col gap-20 py-14 sm:gap-24 sm:py-16">
        <TrustBar />

        <section className="mz-reveal">
          {live.length > 0 ? (
            <LiveAuctionSpotlight auctions={live} />
          ) : (
            <EmptyState
              icon={Gavel}
              title={t("home.noLiveAuctions")}
              description={t("home.noLiveAuctionsHint")}
              action={
                <LinkButton href="/auctions?status=scheduled" variant="secondary" size="md">
                  {t("home.browseUpcoming")}
                </LinkButton>
              }
            />
          )}
        </section>

        <section className="mz-reveal">
          <SectionHeader icon={Crown} title={t("home.vipPlates")} subtitle={t("home.vipPlatesSubtitle")} href="/vip" />
          {vipShowcase.length > 0 ? (
            <Carousel label={t("home.vipPlates")} autoplay loop delay={4500}>
              {vipShowcase.map((plate, index) => (
                <VipPlateCard key={`${plate._id}-${index}`} plate={plate} href="/vip" className={CAROUSEL_ITEM} />
              ))}
            </Carousel>
          ) : (
            <EmptyState icon={Crown} title={t("home.noVipPlates")} description={t("home.noVipPlatesHint")} />
          )}
        </section>

      </div>

        <PromotionalBanner />

      <div className="mz-container flex flex-col gap-20 pb-14 sm:gap-24 sm:pb-16">
        {/* ── Upcoming ─────────────────────────────────────────────── */}
        <section className="mz-reveal">
          <SectionHeader
            icon={Store}
            title={t("home.marketplaceListings")}
            subtitle={t("home.marketplaceListingsSubtitle")}
            href="/listings"
          />
          {marketplaceListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {marketplaceListings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Store}
              title={t("pages.noMatchingListings")}
              action={
                <LinkButton href="/plates/new" variant="secondary" size="md">
                  {t("home.listYourPlate")}
                </LinkButton>
              }
            />
          )}
        </section>

        <section className="mz-reveal">
          <SectionHeader
            icon={CalendarClock}
            title={t("home.upcomingAuctions")}
            subtitle={t("home.upcomingAuctionsSubtitle")}
            href="/auctions?status=scheduled"
          />
          {upcomingShowcase.length > 0 ? (
            <Carousel label={t("home.upcomingAuctions")} autoplay loop delay={5000}>
              {upcomingShowcase.map((auction, index) => (
                <AuctionCard key={`${auction._id}-${index}`} auction={auction} className={CAROUSEL_ITEM} />
              ))}
            </Carousel>
          ) : (
            <EmptyState icon={CalendarClock} title={t("home.noUpcomingAuctions")} description={t("home.noUpcomingAuctionsHint")} />
          )}
        </section>

        <section className="mz-reveal">
          <SectionHeader
            icon={Trophy}
            title={t("home.completedResults")}
            subtitle={t("home.completedResultsSubtitle")}
            href="/auctions?status=completed"
          />
          {completedShowcase.length > 0 ? (
            <Carousel label={t("home.completedResults")} autoplay loop delay={4500}>
              {completedShowcase.map((auction, index) => (
                <AuctionCard key={`${auction._id}-${index}`} auction={auction} className={CAROUSEL_ITEM} />
              ))}
            </Carousel>
          ) : (
            <EmptyState icon={Trophy} title={t("home.noResults")} description={t("home.noResultsHint")} />
          )}
        </section>

        <StatsBand stats={stats} />
      </div>
    </>
  );
}
