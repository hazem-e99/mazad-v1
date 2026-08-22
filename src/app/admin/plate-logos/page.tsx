import { Types } from "mongoose";
import { Image as ImageIcon, Plus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { Plate } from "@/models/Plate";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { toPlateLogoDTOList, type LeanPlateLogo } from "@/lib/dto";
import { PlateLogoRowActions } from "./PlateLogoRowActions";

export const revalidate = 0;

export default async function AdminPlateLogosPage() {
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const [logoDocs, usageRows] = await Promise.all([
    PlateLogo.find({}).sort({ sortOrder: 1, nameAr: 1 }).lean<LeanPlateLogo[]>(),
    Plate.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { logo: { $ne: null } } },
      { $group: { _id: "$logo", count: { $sum: 1 } } },
    ]),
  ]);

  const usageByLogoId = new Map(usageRows.map((row) => [String(row._id), row.count]));
  const logos = toPlateLogoDTOList(logoDocs);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.plateLogosTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.plateLogosSubtitle")}</p>
        </div>
        <LinkButton href="/admin/plate-logos/new" variant="gold" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("admin.addLogoButton")}
        </LinkButton>
      </div>

      {logos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={t("admin.noMatchingLogos")}
          action={
            <LinkButton href="/admin/plate-logos/new" variant="secondary" size="sm">
              {t("admin.addLogoButton")}
            </LinkButton>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {logos.map((logo) => (
              <Card key={logo._id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.image} alt="" className="h-12 w-12 shrink-0 rounded-(--radius-sm) bg-white object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-(--color-text) truncate">{logo.nameAr}</p>
                    <p className="text-xs text-(--color-text-faint) truncate">{logo.nameEn}</p>
                  </div>
                  {logo.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}
                </div>
                <div className="flex items-center justify-between text-xs text-(--color-text-faint)">
                  <span>{t("admin.colSortOrder")}: {logo.sortOrder}</span>
                  <span>{t("admin.colUsageCount")}: {usageByLogoId.get(logo._id) ?? 0}</span>
                </div>
                <PlateLogoRowActions logo={logo} usageCount={usageByLogoId.get(logo._id) ?? 0} />
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.colLogoImage")}</Th>
                    <Th>{t("admin.colNameAr")}</Th>
                    <Th>{t("admin.colNameEn")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th>{t("admin.colSortOrder")}</Th>
                    <Th>{t("admin.colUsageCount")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colDate")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {logos.map((logo) => (
                    <Tr key={logo._id}>
                      <Td>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.image} alt="" className="h-10 w-10 rounded-(--radius-sm) bg-white object-contain p-1" />
                      </Td>
                      <Td>{logo.nameAr}</Td>
                      <Td>{logo.nameEn}</Td>
                      <Td>{logo.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}</Td>
                      <Td className="tnum">{logo.sortOrder}</Td>
                      <Td className="tnum">{usageByLogoId.get(logo._id) ?? 0}</Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">{formatDateTime(logo.createdAt, locale)}</Td>
                      <Td>
                        <PlateLogoRowActions logo={logo} usageCount={usageByLogoId.get(logo._id) ?? 0} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
        </>
      )}
    </div>
  );
}
