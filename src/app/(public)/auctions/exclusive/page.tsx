import { Sparkles } from "lucide-react";
import { getExclusiveAuctions } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionGrid } from "@/components/auction/AuctionGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 0;

export default async function ExclusiveAuctionsPage() {
  const [auctions, { t }] = await Promise.all([getExclusiveAuctions(60), getServerTranslator()]);

  return (
    <div className="mz-container py-10">
      <PageHeader
        premium
        icon={Sparkles}
        title={t("pages.exclusiveTitle")}
        subtitle={t("pages.exclusiveSubtitle")}
      />

      {auctions.length > 0 ? (
        <AuctionGrid auctions={auctions} />
      ) : (
        <EmptyState
          icon={Sparkles}
          title={t("pages.noExclusiveAuctions")}
          description={t("home.noUpcomingAuctionsHint")}
          action={
            <LinkButton href="/auctions" variant="secondary" size="md">
              {t("home.browseAuctions")}
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
