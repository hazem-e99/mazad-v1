import { Crown } from "lucide-react";
import { getVipPlates } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { VipPlateCard } from "@/components/plate/VipPlateCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 0;

export default async function VipPage() {
  const [plates, { t }] = await Promise.all([getVipPlates(60), getServerTranslator()]);

  return (
    <div className="mz-container py-10">
      <PageHeader
        premium
        icon={Crown}
        title={t("pages.vipTitle")}
        subtitle={t("pages.vipHeroTagline")}
      >
        {plates.length > 0 && (
          <span className="tnum rounded-full border border-(--color-gold)/30 bg-(--color-gold-tint) px-4 py-1.5 text-sm font-semibold text-(--color-gold)">
            {t("home.vipCountLabel", { count: plates.length })}
          </span>
        )}
      </PageHeader>

      {plates.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plates.map((plate) => (
            <VipPlateCard key={plate._id} plate={plate} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Crown}
          title={t("pages.noVipPlatesYet")}
          description={t("home.noVipPlatesHint")}
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
