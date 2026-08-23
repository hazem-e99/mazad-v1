import { connectDB } from "@/lib/db";
import { PlateCategory } from "@/models/PlateCategory";
import { Plate } from "@/models/Plate";
import { Types } from "mongoose";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { toPlateCategoryDTOList, type LeanPlateCategory } from "@/lib/dto";
import { PlateCategoryRowActions } from "./PlateCategoryRowActions";

export const revalidate = 0;

export default async function AdminPlateCategoriesPage() {
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const [categoryDocs, usageAgg] = await Promise.all([
    PlateCategory.find({}).sort({ sortOrder: 1, nameAr: 1 }).lean<LeanPlateCategory[]>(),
    Plate.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { category: { $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);
  const categories = toPlateCategoryDTOList(categoryDocs);
  const usageByCategoryId = new Map(usageAgg.map((u) => [String(u._id), u.count]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.plateCategoriesTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.plateCategoriesSubtitle")}</p>
        </div>
        <LinkButton href="/admin/plate-categories/new" variant="gold" size="md">
          {t("admin.addCategoryButton")}
        </LinkButton>
      </div>

      {categories.length === 0 ? (
        <EmptyState title={t("admin.noMatchingCategories")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {categories.map((c) => (
              <Card key={c._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-(--color-text)">{c.nameAr}</p>
                    <p className="text-xs text-(--color-text-muted)">{c.nameEn}</p>
                  </div>
                  {c.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}
                </div>
                <p className="text-xs text-(--color-text-faint)">
                  {t("admin.colUsageCount")}: {usageByCategoryId.get(c._id) ?? 0} · {formatDateTime(c.createdAt, locale)}
                </p>
                <PlateCategoryRowActions category={c} usageCount={usageByCategoryId.get(c._id) ?? 0} />
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.colImage")}</Th>
                    <Th>{t("admin.colNameAr")}</Th>
                    <Th>{t("admin.colNameEn")}</Th>
                    <Th>{t("admin.filterStatus")}</Th>
                    <Th>{t("admin.colSortOrder")}</Th>
                    <Th>{t("admin.colUsageCount")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colDateAdded")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {categories.map((c) => (
                    <Tr key={c._id}>
                      <Td>
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image}
                            alt=""
                            className="h-10 w-14 rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs text-(--color-text-faint)">—</span>
                        )}
                      </Td>
                      <Td>{c.nameAr}</Td>
                      <Td>{c.nameEn}</Td>
                      <Td>{c.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}</Td>
                      <Td className="tnum">{c.sortOrder}</Td>
                      <Td className="tnum">{usageByCategoryId.get(c._id) ?? 0}</Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">{formatDateTime(c.createdAt, locale)}</Td>
                      <Td>
                        <PlateCategoryRowActions category={c} usageCount={usageByCategoryId.get(c._id) ?? 0} />
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
