import { Gavel } from "lucide-react";
import { getHomeAuctions, getVipPlates, getPlatformStats, getMarketplaceListings } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { LiveAuctionSpotlight } from "@/components/home/LiveAuctionSpotlight";
import { StatsBand } from "@/components/home/StatsBand";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import {
  CompletedResults,
  CuratedVipSection,
  DirectSaleSection,
  HomeFinalCta,
  UpcomingSchedule,
} from "@/components/home/HomeEditorialSections";

export const revalidate = 0;

export default async function HomePage() {
  const [{ live, upcoming, recentlyCompleted }, vipPlates, marketplaceListings, stats, { t, locale }] = await Promise.all([
    getHomeAuctions(),
    getVipPlates(10),
    getMarketplaceListings(6),
    getPlatformStats(),
    getServerTranslator(),
  ]);

  return (
    <>
      <Hero />

      <section className="mz-section pt-8 sm:pt-10">
        <div className="mz-container">
          <TrustBar />
        </div>
      </section>

      <section className="mz-section mz-section-surface">
        <div className="mz-container">
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
        </div>
      </section>

      <CuratedVipSection plates={vipPlates} locale={locale} t={t} />
      <DirectSaleSection listings={marketplaceListings} locale={locale} t={t} />
      <UpcomingSchedule auctions={upcoming} locale={locale} t={t} />
      <CompletedResults auctions={recentlyCompleted} locale={locale} t={t} />

      <section className="mz-section pt-0">
        <div className="mz-container">
          <StatsBand stats={stats} />
        </div>
      </section>

      <HomeFinalCta plate={vipPlates[0]} locale={locale} t={t} />
    </>
  );
}
