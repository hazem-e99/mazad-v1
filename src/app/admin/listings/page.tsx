import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/User";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import { MODERATION_STATUSES, SUBMISSION_TYPES } from "@/lib/constants";
import { toPlateDTOList, type LeanPlate } from "@/lib/dto";
import { ListingModerationActions } from "./ListingModerationActions";

export const revalidate = 0;

const statusTone: Record<string, "live" | "scheduled" | "sold" | "unsold" | "neutral"> = {
  pending: "scheduled",
  approved: "sold",
  rejected: "unsold",
};

interface Props {
  searchParams: Promise<{ status?: string; submissionType?: string; page?: string }>;
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const status = params.status && MODERATION_STATUSES.includes(params.status as never) ? params.status : "pending";
  const filter: Record<string, unknown> = { submissionType: { $ne: null }, moderationStatus: status };
  if (params.submissionType) filter.submissionType = params.submissionType;

  const [docs, total] = await Promise.all([
    Plate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("logo")
      .populate("category")
      .populate("ownerUser", "name phone")
      .lean<LeanPlate[]>(),
    Plate.countDocuments(filter),
  ]);
  const listings = toPlateDTOList(docs);
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.listingsModerationTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.listingsModerationSubtitle")}</p>
      </div>

      <FilterBar
        selects={[
          {
            key: "status",
            label: t("admin.filterStatus"),
            options: MODERATION_STATUSES.map((s) => ({ value: s, label: t(`pages.moderationStatus_${s}`) })),
          },
          {
            key: "submissionType",
            label: t("pages.howToListQuestion"),
            options: SUBMISSION_TYPES.map((s) => ({
              value: s,
              label: s === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest"),
            })),
          },
        ]}
      />

      {listings.length === 0 ? (
        <EmptyState title={t("admin.noMatchingListings")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {listings.map((listing) => (
              <Card key={listing._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-(--color-text)">{listing.title || `${listing.lettersAr} ${listing.numbers}`}</p>
                  <Badge tone={statusTone[listing.moderationStatus ?? "pending"]}>{t(`pages.moderationStatus_${listing.moderationStatus ?? "pending"}`)}</Badge>
                </div>
                <p className="text-xs text-(--color-text-muted)">
                  {listing.submissionType === "auction_request" ? t("pages.submissionTypeAuctionRequest") : t("pages.submissionTypeMarketplace")}
                  {listing.price != null ? ` · ${formatSar(listing.price, locale)}` : ""}
                </p>
                <p className="text-xs text-(--color-text-muted)">
                  {t("admin.colSubmitter")}: {listing.owner?.name || "—"}
                  {listing.owner?.phone ? ` · ${listing.owner.phone}` : ""}
                </p>
                <p className="text-xs text-(--color-text-faint)">{formatDateTime(listing.createdAt, locale)}</p>
                <ListingModerationActions listing={listing} showDetailsLink />
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
                    <Th>{t("admin.colTitle")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colSubmitter")}</Th>
                    <Th>{t("pages.howToListQuestion")}</Th>
                    <Th>{t("admin.colPrice")}</Th>
                    <Th>{t("admin.filterStatus")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colDateAdded")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {listings.map((listing) => (
                    <Tr key={listing._id}>
                      <Td className="max-w-[220px] truncate">
                        <Link href={`/admin/listings/${listing._id}`} className="hover:text-(--color-gold)">
                          {listing.title || `${listing.lettersAr} ${listing.numbers}`}
                        </Link>
                      </Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-muted)">
                        {listing.owner?.name || "—"}
                        {listing.owner?.phone ? <span className="tnum block text-(--color-text-faint)">{listing.owner.phone}</span> : null}
                      </Td>
                      <Td>{listing.submissionType === "auction_request" ? t("pages.submissionTypeAuctionRequest") : t("pages.submissionTypeMarketplace")}</Td>
                      <Td className="tnum">{listing.price != null ? formatSar(listing.price, locale) : "—"}</Td>
                      <Td>
                        <Badge tone={statusTone[listing.moderationStatus ?? "pending"]}>{t(`pages.moderationStatus_${listing.moderationStatus ?? "pending"}`)}</Badge>
                      </Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">{formatDateTime(listing.createdAt, locale)}</Td>
                      <Td>
                        <ListingModerationActions listing={listing} showDetailsLink />
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
