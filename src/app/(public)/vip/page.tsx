import { Crown } from "lucide-react";
import { getVipPlates } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";

export const revalidate = 0;

export default async function VipPage() {
  const [plates, { t, locale }] = await Promise.all([getVipPlates(50), getServerTranslator()]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="rounded-(--radius-lg) border border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow) px-6 sm:px-10 py-8 sm:py-10 mb-8 flex flex-col items-center text-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-vip-bg) border border-(--color-gold)/30 text-(--color-gold)">
          <Crown className="h-6 w-6" aria-hidden="true" strokeWidth={2} />
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-(--color-text) tracking-tight">{t("pages.vipTitle")}</h1>
        <p className="text-(--color-text-muted) max-w-md">{t("pages.vipSubtitle")}</p>
        {plates.length > 0 && (
          <span className="tnum text-sm font-semibold text-(--color-gold)">{t("home.vipCountLabel", { count: plates.length })}</span>
        )}
      </div>

      {plates.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,320px))] justify-center gap-5">
          {plates.map((p) => (
            <Card
              key={p._id}
              className="group flex flex-col items-center gap-4 border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow) p-6 transition-transform duration-(--duration-base) hover:-translate-y-1"
            >
              <PlateRenderer
                type={p.type}
                lettersAr={p.lettersAr}
                lettersEn={p.lettersEn}
                numbers={p.numbers}
                logo={p.logo}
                size="md"
                locale={locale}
                className="transition-transform duration-(--duration-base) group-hover:scale-[1.03]"
              />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Crown} title={t("pages.noVipPlatesYet")} />
      )}
    </div>
  );
}
