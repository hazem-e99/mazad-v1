import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";
import { getServerTranslator } from "@/lib/i18n-server";
import { toPlateDTO, type LeanPlate } from "@/lib/dto";
import { PlateRowActions } from "@/app/admin/plates/PlateRowActions";

export const revalidate = 0;

export default async function AdminVipPage() {
  await connectDB();
  const [plateDocs, { t, locale }] = await Promise.all([
    Plate.find({ isVip: true }).sort({ createdAt: -1 }).lean<LeanPlate[]>(),
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,280px))] gap-4">
          {plates.map((p) => (
            <Card key={p._id} className="flex flex-col items-center gap-3 border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow) p-5">
              <PlateRenderer
                type={p.type}
                lettersAr={p.lettersAr}
                lettersEn={p.lettersEn}
                numbers={p.numbers}
                logo={p.logo}
                size="sm"
                locale={locale}
              />
              <PlateRowActions plateId={p._id} isVip={p.isVip} isVisible={p.isVisible} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
