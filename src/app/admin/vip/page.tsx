import { connectDB } from "@/lib/db";
import Image from "next/image";
import { Plate } from "@/models/Plate";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";
import { getServerTranslator } from "@/lib/i18n-server";
import { toPlateDTO, type LeanPlate } from "@/lib/dto";
import { PlateRowActions } from "@/app/admin/plates/PlateRowActions";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { plateTypeLabel } from "@/lib/constants";

export const revalidate = 0;

export default async function AdminVipPage() {
  await connectDB();
  const [plateDocs, { t, locale }] = await Promise.all([
    Plate.find({ isVip: true }).sort({ createdAt: -1 }).populate("logo").lean<LeanPlate[]>(),
    getServerTranslator(),
  ]);
  const plates = plateDocs.map(toPlateDTO);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.vipTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.vipSubtitle")}</p>
      </div>

      {plates.length === 0 ? (
        <EmptyState title={t("admin.noVipPlatesYet")} description={t("admin.noVipPlatesHint")} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {plates.map((p) => (
            <Card key={p._id} className="group flex min-w-0 flex-col overflow-hidden border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-card) transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-(--color-gold)/60 hover:shadow-(--shadow-gold-glow)">
              <div className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-(--color-text)">{t("admin.vipPlateLabel")}</p>
                  <p className="mt-1 text-xs text-(--color-text-faint)">
                    {p.lettersEn} {p.numbers}
                  </p>
                </div>
                <span className="rounded-full border border-(--color-gold)/30 bg-(--color-gold-tint) px-2.5 py-1 text-xs font-medium text-(--color-gold)">
                  {t("auction.vipBadge")}
                </span>
              </div>

              {/* The record's own photo when it has one, and the plate drawn
                  from its own letters and numbers when it does not.
                  Previously a plate with no photo borrowed one of five stock
                  pictures chosen by its position in this list — so an admin
                  checking whether a VIP plate had artwork was shown artwork
                  that belonged to no plate at all. */}
              <div className="relative mx-4 my-5 flex aspect-[2.65/1] items-center justify-center overflow-hidden rounded-(--radius-md) bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.22)] sm:mx-5 sm:my-6 sm:p-4">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={t("admin.uploadedPlatePhoto")}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 30vw"
                    className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <SaudiPlate
                    type={p.type}
                    lettersAr={p.lettersAr}
                    lettersEn={p.lettersEn}
                    numbers={p.numbers}
                    logo={p.logo}
                    size="lg"
                    locale={locale}
                    className="max-w-full"
                  />
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-(--color-border) px-5 py-4">
                <span className="text-xs text-(--color-text-muted)">{plateTypeLabel(p.type, locale)}</span>
                <PlateRowActions plateId={p._id} isVip={p.isVip} isVisible={p.isVisible} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
