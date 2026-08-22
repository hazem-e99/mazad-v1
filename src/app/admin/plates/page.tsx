import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { plateTypeLabel, PLATE_TYPES } from "@/lib/constants";
import { toPlateDTO, type LeanPlate } from "@/lib/dto";
import { PlateRowActions } from "./PlateRowActions";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ search?: string; type?: string; isVip?: string; page?: string }>;
}

export default async function AdminPlatesPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const filter: Record<string, unknown> = {};
  if (params.type) filter.type = params.type;
  if (params.isVip === "true") filter.isVip = true;
  if (params.search) {
    filter.$or = [
      { lettersEn: { $regex: params.search, $options: "i" } },
      { lettersAr: { $regex: params.search, $options: "i" } },
      { numbers: { $regex: params.search, $options: "i" } },
    ];
  }

  const [plateDocs, total] = await Promise.all([
    Plate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanPlate[]>(),
    Plate.countDocuments(filter),
  ]);
  const plates = plateDocs.map(toPlateDTO);
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.platesTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.platesSubtitle")}</p>
        </div>
        <LinkButton href="/admin/plates/new" variant="gold" size="md">
          {t("admin.addPlateButton")}
        </LinkButton>
      </div>

      <FilterBar
        searchPlaceholder={t("admin.searchPlatesPlaceholder")}
        selects={[
          {
            key: "type",
            label: t("admin.filterType"),
            options: PLATE_TYPES.map((type) => ({ value: type, label: plateTypeLabel(type, locale) })),
          },
          { key: "isVip", label: t("admin.colVip"), options: [{ value: "true", label: t("admin.filterVipOnly") }] },
        ]}
      />

      {plates.length === 0 ? (
        <EmptyState title={t("admin.noMatchingPlates")} />
      ) : (
        <>
          {/* Mobile: stacked cards preserve every field; desktop: table. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {plates.map((p) => (
              <Card key={p._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-semibold text-(--color-text)">
                      {p.lettersAr} {p.numbers}
                    </p>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">{plateTypeLabel(p.type, locale)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.isVip && <Badge tone="vip">VIP</Badge>}
                    {p.isVisible ? <Badge tone="sold">{t("admin.visible")}</Badge> : <Badge tone="neutral">{t("admin.hidden")}</Badge>}
                  </div>
                </div>
                <p className="text-xs text-(--color-text-faint)">{new Date(p.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}</p>
                <div className="pt-1">
                  <PlateRowActions plateId={p._id} isVip={p.isVip} isVisible={p.isVisible} />
                </div>
              </Card>
            ))}
            <Card>
              <Pagination page={page} pages={pages} total={total} />
            </Card>
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.colPlate")}</Th>
                    <Th>{t("admin.colType")}</Th>
                    <Th>{t("admin.colVip")}</Th>
                    <Th>{t("admin.colVisible")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colDateAdded")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {plates.map((p) => (
                    <Tr key={p._id}>
                      <Td className="font-mono">
                        {p.lettersAr} {p.numbers}
                      </Td>
                      <Td>{plateTypeLabel(p.type, locale)}</Td>
                      <Td>{p.isVip ? <Badge tone="vip">VIP</Badge> : "—"}</Td>
                      <Td>{p.isVisible ? <Badge tone="sold">{t("admin.visible")}</Badge> : <Badge tone="neutral">{t("admin.hidden")}</Badge>}</Td>
                      <Td className="hidden lg:table-cell text-(--color-text-faint) text-xs">
                        {new Date(p.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                      </Td>
                      <Td>
                        <PlateRowActions plateId={p._id} isVip={p.isVip} isVisible={p.isVisible} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={page} pages={pages} total={total} />
            </TableContainer>
          </div>
        </>
      )}
    </div>
  );
}
