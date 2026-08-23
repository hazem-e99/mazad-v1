import { Suspense } from "react";
import {
  getCompletedAuctions,
  getLiveAuctions,
  getMarketplaceListings,
  getPlatformStats,
  getUpcomingAuctions,
  getVipPlates,
} from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { LiveAuctionsSection } from "@/components/home/LiveAuctionsSection";
import { StatsBand } from "@/components/home/StatsBand";
import {
  CardRowSkeleton,
  CuratedSkeleton,
  ListRowsSkeleton,
  LiveStageSkeleton,
  SectionError,
  StatsBandSkeleton,
} from "@/components/home/HomeSectionFallbacks";
import {
  CompletedResults,
  CuratedVipSection,
  DirectSaleSection,
  HomeFinalCta,
  UpcomingSchedule,
} from "@/components/home/HomeEditorialSections";

export const revalidate = 0;

/**
 * Every figure, plate, price and badge below is read from MongoDB at
 * request time through src/lib/queries.ts — there is no fixture, no
 * seeded array and no placeholder anywhere in this tree.
 *
 * Each section fetches its own slice and is wrapped in its own Suspense
 * boundary, so a slow collection delays only its own strip and a failing
 * one degrades to that strip's error state instead of turning the whole
 * home page into a 500. `revalidate = 0` keeps it request-fresh; live
 * prices then track the database over the socket (LiveAuctionsSection)
 * rather than waiting for the next navigation.
 */
export default function HomePage() {
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
          <Suspense fallback={<LiveStageSkeleton />}>
            <LiveAuctionsBlock />
          </Suspense>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="mz-section">
            <div className="mz-container">
              <CuratedSkeleton />
            </div>
          </section>
        }
      >
        <VipBlock />
      </Suspense>

      <Suspense
        fallback={
          <section className="mz-section mz-section-surface">
            <div className="mz-container">
              <CardRowSkeleton />
            </div>
          </section>
        }
      >
        <MarketplaceBlock />
      </Suspense>

      <Suspense
        fallback={
          <section className="mz-section">
            <div className="mz-container">
              <ListRowsSkeleton count={4} />
            </div>
          </section>
        }
      >
        <UpcomingBlock />
      </Suspense>

      <Suspense
        fallback={
          <section className="mz-section mz-section-surface">
            <div className="mz-container">
              <ListRowsSkeleton count={5} height="h-20" />
            </div>
          </section>
        }
      >
        <CompletedBlock />
      </Suspense>

      <section className="mz-section pt-0">
        <div className="mz-container">
          <Suspense fallback={<StatsBandSkeleton />}>
            <StatsBlock />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <FinalCtaBlock />
      </Suspense>
    </>
  );
}

/**
 * A section's query failing is a section-sized problem. Logging keeps the
 * cause visible on the server; the reader gets that strip's retry rather
 * than an error page in place of the entire home page.
 */
async function section<T>(name: string, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    console.error(`home: "${name}" section failed to load:`, err);
    return null;
  }
}

async function LiveAuctionsBlock() {
  const data = await section("live-auctions", async () => {
    const [live, upcoming] = await Promise.all([getLiveAuctions(8), getUpcomingAuctions(6)]);
    return { live, upcoming };
  });

  if (!data) return <SectionError />;

  // Scheduled auctions are watched but not rendered here: their rooms are
  // what carry `auction_started`, which is how a newly-opened auction
  // reaches this section without a reload.
  const watchIds = [...data.live, ...data.upcoming].map((auction) => auction._id);

  return <LiveAuctionsSection auctions={data.live} watchIds={watchIds} />;
}

async function VipBlock() {
  const [plates, translator] = await Promise.all([
    section("vip-plates", () => getVipPlates(5)),
    getServerTranslator(),
  ]);

  if (!plates) {
    return (
      <section className="mz-section">
        <div className="mz-container">
          <SectionError />
        </div>
      </section>
    );
  }

  return <CuratedVipSection plates={plates} locale={translator.locale} t={translator.t} />;
}

async function MarketplaceBlock() {
  const [listings, translator] = await Promise.all([
    section("marketplace", () => getMarketplaceListings(3)),
    getServerTranslator(),
  ]);

  if (!listings) {
    return (
      <section className="mz-section mz-section-surface">
        <div className="mz-container">
          <SectionError />
        </div>
      </section>
    );
  }

  return <DirectSaleSection listings={listings} locale={translator.locale} t={translator.t} />;
}

async function UpcomingBlock() {
  const [auctions, translator] = await Promise.all([
    section("upcoming-auctions", () => getUpcomingAuctions(6)),
    getServerTranslator(),
  ]);

  if (!auctions) {
    return (
      <section className="mz-section">
        <div className="mz-container">
          <SectionError />
        </div>
      </section>
    );
  }

  return <UpcomingSchedule auctions={auctions} locale={translator.locale} t={translator.t} />;
}

async function CompletedBlock() {
  const [auctions, translator] = await Promise.all([
    section("completed-auctions", () => getCompletedAuctions(6)),
    getServerTranslator(),
  ]);

  if (!auctions) {
    return (
      <section className="mz-section mz-section-surface">
        <div className="mz-container">
          <SectionError />
        </div>
      </section>
    );
  }

  return <CompletedResults auctions={auctions} locale={translator.locale} t={translator.t} />;
}

async function StatsBlock() {
  const stats = await section("stats", () => getPlatformStats());
  if (!stats) return <SectionError />;
  return <StatsBand stats={stats} />;
}

async function FinalCtaBlock() {
  // Same argument as the VIP section above, so React's per-request cache
  // serves this from that section's read instead of issuing a second query.
  const [plates, translator] = await Promise.all([
    section("final-cta", () => getVipPlates(5)),
    getServerTranslator(),
  ]);

  // The closing panel's plate is decoration around a call to action — if
  // that one read fails the panel still renders, with its own fallback
  // mark instead of a plate.
  return <HomeFinalCta plate={plates?.[0]} locale={translator.locale} t={translator.t} />;
}
