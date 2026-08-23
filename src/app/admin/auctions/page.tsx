import Link from "next/link";
import { checkPagePermission } from "@/lib/auth";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { connectDB } from "@/lib/db";
import { Auction } from "@/models/Auction";
import "@/models/Plate";
import "@/models/PlateLogo";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/layout/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { AUCTION_STATUSES, AUCTION_CATEGORIES } from "@/lib/constants";
import { toAuctionDTOList, type LeanAuction } from "@/lib/dto";
import { LivePrice, LiveStatusBadge, LiveEndAt, AdminRealtimeStatus } from "@/components/admin/LiveAuctionCells";
import { AdminLiveRefresher } from "@/components/admin/AdminLiveRefresher";
import type { AuctionStatus } from "@/lib/constants";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>;
}

export default async function AdminAuctionsPage({ searchParams }: Props) {
  // The section layout admits anyone with create *or* manage; the list
  // and detail screens are management surfaces specifically.
  if (!(await checkPagePermission("auction:manage"))) return <AccessDenied />;
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const statusLabelMap: Record<string, string> = {
    draft: t("common.status"),
    scheduled: t("auction.scheduled"),
    live: t("auction.live"),
    ended: t("auction.ended"),
    sold: t("auction.sold"),
    unsold: t("auction.unsold"),
    purchased: t("auction.purchased"),
    cancelled: t("auction.cancelled"),
  };

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.category) filter.category = params.category;

  const [auctionDocs, total] = await Promise.all([
    Auction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "plate", populate: { path: "logo" } })
      .lean<LeanAuction[]>(),
    Auction.countDocuments(filter),
  ]);
  const auctions = toAuctionDTOList(auctionDocs);
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      {/* Rows below carry their own live price/status; this additionally
          re-reads the paginated result set so newly-matching auctions and
          the total count stay correct too. */}
      <AdminLiveRefresher />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.auctionsTitle")}</h1>
          <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.auctionsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeStatus className="hidden sm:inline-flex" />
          <LinkButton href="/admin/auctions/new" variant="gold" size="md">
            {t("admin.createAuctionButton")}
          </LinkButton>
        </div>
      </div>

      <FilterBar
        selects={[
          {
            key: "status",
            label: t("admin.filterStatus"),
            options: AUCTION_STATUSES.map((s) => ({ value: s, label: statusLabelMap[s] ?? s })),
          },
          {
            key: "category",
            label: t("admin.filterCategory"),
            options: AUCTION_CATEGORIES.map((c) => ({
              value: c,
              label: c === "exclusive" ? t("admin.categoryExclusive") : t("admin.categoryRegular"),
            })),
          },
        ]}
      />

      {auctions.length === 0 ? (
        <EmptyState title={t("admin.noMatchingAuctions")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {auctions.map((a) => (
              <Card key={a._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <p className="font-mono font-semibold text-(--color-text)">
                    {a.plate.lettersAr} {a.plate.numbers}
                  </p>
                  <LiveStatusBadge auctionId={a._id} status={a.status as AuctionStatus} />
                </div>
                <p className="text-lg font-bold text-(--color-gold)">
                  <LivePrice
                    auctionId={a._id}
                    currentPrice={a.currentPrice}
                    finalPrice={a.finalPrice}
                    status={a.status as AuctionStatus}
                    locale={locale}
                  />
                </p>
                <div className="flex justify-between text-xs text-(--color-text-faint)">
                  <span>{formatDateTime(a.startAt, locale)}</span>
                  <LiveEndAt auctionId={a._id} endAt={a.endAt} locale={locale} />
                </div>
                <Link href={`/admin/auctions/${a._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover) pt-1">
                  {t("admin.manageAction")}
                </Link>
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
                    <Th>{t("admin.filterStatus")}</Th>
                    <Th>{t("admin.colCurrentPrice")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colStart")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colEnd")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {auctions.map((a) => (
                    <Tr key={a._id}>
                      <Td className="font-mono">
                        {a.plate.lettersAr} {a.plate.numbers}
                      </Td>
                      <Td>
                        <LiveStatusBadge auctionId={a._id} status={a.status as AuctionStatus} />
                      </Td>
                      <Td>
                        <LivePrice
                          auctionId={a._id}
                          currentPrice={a.currentPrice}
                          finalPrice={a.finalPrice}
                          status={a.status as AuctionStatus}
                          locale={locale}
                          className="font-semibold text-(--color-gold)"
                        />
                      </Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">{formatDateTime(a.startAt, locale)}</Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">
                        <LiveEndAt auctionId={a._id} endAt={a.endAt} locale={locale} />
                      </Td>
                      <Td>
                        <Link href={`/admin/auctions/${a._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover)">
                          {t("admin.manageAction")}
                        </Link>
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
