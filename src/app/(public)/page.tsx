import { Suspense } from "react";
import {
  getHomeCategories,
  getLatestPlates,
  getLiveAuctions,
  getPlatformStats,
  getVipPlates,
} from "@/lib/queries";
import { getSiteSettings } from "@/lib/siteSettingsQueries";
import { Hero } from "@/components/home/Hero";
import { FeaturedAds } from "@/components/home/FeaturedAds";
import { StatsPanel } from "@/components/home/StatsPanel";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { SellPlateBanner } from "@/components/home/SellPlateBanner";
import { LatestPlates } from "@/components/home/LatestPlates";
import {
  CardRowSkeleton,
  CategoryTilesSkeleton,
  FeaturedAdsSkeleton,
  SectionError,
  StatsPanelSkeleton,
} from "@/components/home/HomeSectionFallbacks";

export const revalidate = 0;

/**
 * The home page.
 *
 * Reading order, top to bottom: the stage (mark, tagline, search), the
 * featured panel overlapping its lower edge, the stats band, the
 * admin-managed categories, the sell-your-plate banner and the newest
 * listings.
 *
 * Every plate, price, count and category below is read from MongoDB at
 * request time through src/lib/queries.ts. There is no fixture, no seeded
 * array and no hardcoded figure in this tree — flag a plate VIP, publish
 * a listing, open an auction or add a category and the matching section
 * changes on the next request with nothing edited here.
 *
 * Each section fetches its own slice inside its own Suspense boundary, so
 * a slow collection delays one strip and a failing one degrades to that
 * strip's retry rather than turning the page into a 500.
 */
export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Hero settings={settings} />

      {/* The featured panel rides up over the stage's lower fade — the
          scrim ends in the page canvas, so the overlap has no seam. */}
      <div className="mz-container relative z-10 -mt-16 sm:-mt-20">
        <Suspense fallback={<FeaturedAdsSkeleton />}>
          <FeaturedBlock />
        </Suspense>
      </div>

      <div className="mz-container mt-5 sm:mt-6">
        <Suspense fallback={<StatsPanelSkeleton />}>
          <StatsBlock />
        </Suspense>
      </div>

      <section className="mz-container pt-12 sm:pt-16">
        <Suspense fallback={<CategoryTilesSkeleton />}>
          <CategoriesBlock />
        </Suspense>
      </section>

      <section className="mz-container pt-12 sm:pt-16">
        <SellBlock />
      </section>

      <section className="mz-container pb-10 pt-8 sm:pb-12 sm:pt-10">
        <Suspense fallback={<CardRowSkeleton count={4} />}>
          <LatestBlock />
        </Suspense>
      </section>
    </>
  );
}

/**
 * A section's query failing is a section-sized problem. Logging keeps the
 * cause visible on the server; the reader gets that strip's retry rather
 * than an error page in place of the whole home page.
 */
async function section<T>(name: string, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    console.error(`home: "${name}" section failed to load:`, err);
    return null;
  }
}

async function FeaturedBlock() {
  const data = await section("featured-ads", async () => {
    // Live auctions come along so a featured plate that is currently
    // under the hammer shows its bid price, tracked over the socket,
    // instead of a stale asking price.
    const [plates, liveAuctions] = await Promise.all([getVipPlates(10), getLiveAuctions(8)]);
    return { plates, liveAuctions };
  });

  if (!data) return <SectionError />;
  if (data.plates.length === 0) return null;

  return <FeaturedAds plates={data.plates} liveAuctions={data.liveAuctions} />;
}

async function StatsBlock() {
  const stats = await section("stats", () => getPlatformStats());
  if (!stats) return <SectionError />;
  return <StatsPanel stats={stats} />;
}

async function CategoriesBlock() {
  const categories = await section("categories", () => getHomeCategories());
  if (!categories) return <SectionError />;
  if (categories.length === 0) return null;
  return <CategoryTiles categories={categories} />;
}

function SellBlock() {
  // No query: the banner is one photograph plus two links into the
  // existing /plates/new flow, so there is nothing to read.
  return <SellPlateBanner />;
}

async function LatestBlock() {
  const plates = await section("latest-plates", () => getLatestPlates(4));
  if (!plates) return <SectionError />;
  if (plates.length === 0) return null;
  return <LatestPlates plates={plates} />;
}
