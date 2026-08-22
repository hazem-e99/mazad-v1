import { Megaphone, Plus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Advertisement } from "@/models/Advertisement";
import { getServerTranslator } from "@/lib/i18n-server";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { LinkButton } from "@/components/ui/Button";
import { formatSar } from "@/lib/format";
import { toAdvertisementDTOList, type LeanAdvertisement } from "@/lib/dto";
import Image from "next/image";

export const revalidate = 0;

export default async function AdsPage() {
  await connectDB();
  const [adDocs, { t, locale }] = await Promise.all([
    Advertisement.find({ isActive: true }).sort({ createdAt: -1 }).limit(30).lean<LeanAdvertisement[]>(),
    getServerTranslator(),
  ]);
  const ads = toAdvertisementDTOList(adDocs);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title={t("pages.adsTitle")} subtitle={t("pages.adsSubtitle")} />
        <LinkButton href="/ads/new" variant="gold" size="sm" className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("pages.addAd")}
        </LinkButton>
      </div>

      {ads.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {ads.map((ad) => (
            <Card
              key={ad._id}
              className="overflow-hidden transition-all duration-(--duration-base) hover:-translate-y-1 hover:shadow-(--shadow-elevated)"
            >
              <div className="relative aspect-video bg-(--color-bg-elevated)">
                <Image src={ad.image} alt={ad.title} fill className="object-cover" />
              </div>
              <CardBody className="flex flex-col gap-1.5">
                <h3 className="font-semibold text-(--color-text)">{ad.title}</h3>
                {ad.description && <p className="text-sm text-(--color-text-muted) line-clamp-2">{ad.description}</p>}
                {ad.price != null && <p className="tnum text-lg font-bold text-(--color-gold) mt-1">{formatSar(ad.price, locale)}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title={t("pages.noAds")}
          description={t("pages.noAdsHint")}
          action={
            <LinkButton href="/ads/new" variant="secondary" size="sm">
              {t("pages.addAd")}
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
