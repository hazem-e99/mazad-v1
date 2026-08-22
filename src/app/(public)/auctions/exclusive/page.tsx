import { Sparkles } from "lucide-react";
import { getExclusiveAuctions } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeader } from "@/components/layout/SectionHeader";

export const revalidate = 0;

export default async function ExclusiveAuctionsPage() {
  const [auctions, { t }] = await Promise.all([getExclusiveAuctions(50), getServerTranslator()]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <SectionHeader title={t("pages.exclusiveTitle")} subtitle={t("pages.exclusiveSubtitle")} />
      {auctions.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,300px))] justify-center gap-4">
          {auctions.map((a) => (
            <AuctionCard key={a._id} auction={a} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Sparkles} title={t("pages.noExclusiveAuctions")} />
      )}
    </div>
  );
}
