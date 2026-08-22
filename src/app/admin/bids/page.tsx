import Link from "next/link";
import { Gavel, CheckCircle2, XCircle } from "lucide-react";
import { getAdminBids } from "@/lib/adminBidsQuery";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ accepted?: string; page?: string; auction?: string; user?: string }>;
}

export default async function AdminBidsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ items, total, page, pages }, { t, locale }] = await Promise.all([
    getAdminBids({
      accepted: params.accepted,
      auction: params.auction,
      user: params.user,
      page: params.page ? Number(params.page) : 1,
    }),
    getServerTranslator(),
  ]);

  const rejectionReasonLabel: Record<string, string> = {
    outbid_race_lost: t("admin.rejectionReasonOutbid"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.bidsTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.bidsSubtitle")}</p>
      </div>

      <FilterBar
        selects={[
          {
            key: "accepted",
            label: t("common.status"),
            options: [
              { value: "true", label: t("common.accepted") },
              { value: "false", label: t("common.rejected") },
            ],
          },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState icon={Gavel} title={t("admin.noMatchingBids")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {items.map((bid) => (
              <Card key={bid._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  {bid.auction ? (
                    <Link href={`/admin/auctions/${bid.auction._id}`} className="font-mono font-semibold text-(--color-text) hover:text-(--color-gold)">
                      {bid.auction.plate.lettersAr} {bid.auction.plate.numbers}
                    </Link>
                  ) : (
                    <p className="font-mono font-semibold text-(--color-text)">—</p>
                  )}
                  {bid.accepted ? (
                    <Badge tone="sold" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {t("common.accepted")}
                    </Badge>
                  ) : (
                    <Badge tone="neutral" className="gap-1">
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                      {t("common.rejected")}
                    </Badge>
                  )}
                </div>
                <p className="tnum text-lg font-bold text-(--color-gold)">{formatSar(bid.amount, locale)}</p>
                {!bid.accepted && bid.rejectionReason && (
                  <p className="text-xs text-(--color-text-faint)">{rejectionReasonLabel[bid.rejectionReason] ?? bid.rejectionReason}</p>
                )}
                <div className="flex items-center justify-between text-xs text-(--color-text-faint)">
                  <span>
                    {bid.user?.name ?? "—"} <span dir="ltr">{bid.user?.phone}</span>
                  </span>
                  <span>{formatDateTime(bid.createdAt, locale)}</span>
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
                    <Th>{t("common.plate")}</Th>
                    <Th>{t("admin.colUser")}</Th>
                    <Th>{t("admin.colAmount")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th className="hidden md:table-cell">{t("admin.colDate")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {items.map((bid) => (
                    <Tr key={bid._id}>
                      <Td className="font-mono">
                        {bid.auction ? `${bid.auction.plate.lettersAr} ${bid.auction.plate.numbers}` : "—"}
                      </Td>
                      <Td>
                        {bid.user?.name ?? "—"}
                        <span className="block text-xs text-(--color-text-faint)" dir="ltr">
                          {bid.user?.phone}
                        </span>
                      </Td>
                      <Td className="tnum">{formatSar(bid.amount, locale)}</Td>
                      <Td>
                        {bid.accepted ? (
                          <Badge tone="sold" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            {t("common.accepted")}
                          </Badge>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <Badge tone="neutral" className="gap-1">
                              <XCircle className="h-3 w-3" aria-hidden="true" />
                              {t("common.rejected")}
                            </Badge>
                            {bid.rejectionReason && (
                              <span className="text-xs text-(--color-text-faint)">
                                {rejectionReasonLabel[bid.rejectionReason] ?? bid.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td className="hidden md:table-cell text-xs text-(--color-text-faint)">{formatDateTime(bid.createdAt, locale)}</Td>
                      <Td>
                        {bid.auction && (
                          <Link href={`/admin/auctions/${bid.auction._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover)">
                            {t("admin.viewAuction")}
                          </Link>
                        )}
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
