import { connectDB } from "@/lib/db";
import { Advertisement } from "@/models/Advertisement";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { toAdvertisementDTOList, type LeanAdvertisement } from "@/lib/dto";
import { AdModerationToggle } from "./AdModerationToggle";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ search?: string; isActive?: string; page?: string }>;
}

export default async function AdminAdsPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const filter: Record<string, unknown> = {};
  if (params.isActive === "true") filter.isActive = true;
  else if (params.isActive === "false") filter.isActive = false;
  if (params.search) filter.title = { $regex: params.search, $options: "i" };

  const [adDocs, total] = await Promise.all([
    Advertisement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanAdvertisement[]>(),
    Advertisement.countDocuments(filter),
  ]);
  const ads = toAdvertisementDTOList(adDocs);
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.adsTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.adsSubtitle")}</p>
      </div>

      <FilterBar
        searchPlaceholder={t("admin.searchAdsPlaceholder")}
        selects={[
          {
            key: "isActive",
            label: t("common.status"),
            options: [
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.suspended") },
            ],
          },
        ]}
      />

      {ads.length === 0 ? (
        <EmptyState title={t("admin.noMatchingAds")} />
      ) : (
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>{t("admin.colTitle")}</Th>
                <Th className="hidden sm:table-cell">{t("admin.colPrice")}</Th>
                <Th className="hidden md:table-cell">{t("admin.colContact")}</Th>
                <Th>{t("common.status")}</Th>
                <Th className="hidden md:table-cell">{t("admin.colDate")}</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <tbody>
              {ads.map((ad) => (
                <Tr key={ad._id}>
                  <Td>{ad.title}</Td>
                  <Td className="hidden sm:table-cell tnum">{ad.price ?? "—"}</Td>
                  <Td className="hidden md:table-cell" dir="ltr">{ad.contactPhone}</Td>
                  <Td>{ad.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}</Td>
                  <Td className="hidden md:table-cell text-xs text-(--color-text-faint)">{formatDateTime(ad.createdAt, locale)}</Td>
                  <Td>
                    <AdModerationToggle adId={ad._id} isActive={ad.isActive} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} />
        </TableContainer>
      )}
    </div>
  );
}
