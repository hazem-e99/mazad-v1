import { Gavel, Crown, CalendarClock, Trophy } from "lucide-react";
import { getHomeAuctions, getVipPlates, getPlatformStats } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { VipPlateCard } from "@/components/plate/VipPlateCard";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { LiveAuctionSpotlight } from "@/components/home/LiveAuctionSpotlight";
import { StatsBand } from "@/components/home/StatsBand";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Carousel } from "@/components/ui/Carousel";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 0;

/* Carousel items reveal ~1.15 cards on the narrowest phone so the
   horizontal affordance is visible without a scroll hint (§49). */
const CAROUSEL_ITEM = "mz-snap w-[min(19rem,78vw)] shrink-0";

export default async function HomePage() {
  const [{ live, upcoming, recentlyCompleted }, vipPlates, stats, { t, locale }] = await Promise.all([
    getHomeAuctions(),
    getVipPlates(10),
    getPlatformStats(),
    getServerTranslator(),
  ]);

  const featured = live[0] ?? upcoming[0] ?? null;

  return (
    <>
      <Hero featured={featured} vipPlates={vipPlates} liveCount={live.length} />

      <div className="mz-container flex flex-col gap-20 py-14 sm:gap-24 sm:py-16">
        <TrustBar />

        {/* ── Live now ─────────────────────────────────────────────── */}
        <section className="mz-reveal">
          <SectionHeader
            eyebrow={t("auction.live")}
            eyebrowTone="live"
            title={t("home.liveAuctions")}
            subtitle={t("home.liveAuctionsSubtitle")}
            href="/auctions?status=live"
          />
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

        {/* ── VIP ──────────────────────────────────────────────────── */}
        <section className="mz-reveal">
          <SectionHeader
            icon={Crown}
            title={t("home.vipPlates")}
            subtitle={t("home.vipPlatesSubtitle")}
            href="/vip"
          />
          {vipPlates.length > 0 ? (
            <Carousel label={t("home.vipPlates")}>
              {vipPlates.map((plate) => (
                <VipPlateCard key={plate._id} plate={plate} href="/vip" className={CAROUSEL_ITEM} />
              ))}
            </Carousel>
          ) : (
            <EmptyState icon={Crown} title={t("home.noVipPlates")} description={t("home.noVipPlatesHint")} />
          )}
        </section>

        {/* ── Upcoming ─────────────────────────────────────────────── */}
        <section className="mz-reveal">
          <SectionHeader
            icon={CalendarClock}
            title={t("home.upcomingAuctions")}
            subtitle={t("home.upcomingAuctionsSubtitle")}
            href="/auctions?status=scheduled"
          />
          {upcoming.length > 0 ? (
            <Carousel label={t("home.upcomingAuctions")}>
              {upcoming.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} className={CAROUSEL_ITEM} />
              ))}
            </Carousel>
          ) : (
            <EmptyState icon={CalendarClock} title={t("home.noUpcomingAuctions")} description={t("home.noUpcomingAuctionsHint")} />
          )}
        </section>

        {/* ── Results ──────────────────────────────────────────────── */}
        <section className="mz-reveal">
          <SectionHeader
            icon={Trophy}
            title={t("home.completedResults")}
            subtitle={t("home.completedResultsSubtitle")}
            href="/auctions?status=completed"
          />
          {recentlyCompleted.length > 0 ? (
            <Carousel label={t("home.completedResults")}>
              {recentlyCompleted.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} className={CAROUSEL_ITEM} />
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
