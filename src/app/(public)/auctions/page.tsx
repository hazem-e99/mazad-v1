import { Gavel } from "lucide-react";
import { getAuctionsList } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionGrid } from "@/components/auction/AuctionGrid";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { LinkButton } from "@/components/ui/Button";
import { PLATE_TYPES, plateTypeLabel } from "@/lib/constants";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{
    status?: string;
    category?: string;
    vip?: string;
    plateType?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AuctionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ items: auctions, total, page, pages }, { t, locale }] = await Promise.all([
    getAuctionsList({
      status: params.status,
      category: params.category,
      vip: params.vip === "true",
      plateType: params.plateType,
      search: params.search,
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
    }),
    getServerTranslator(),
  ]);

  const hasActiveFilters = Boolean(
    params.status || params.category || params.vip || params.plateType || params.search || params.sort
  );

  return (
    <div className="mz-container py-10">
      <PageHeader
        icon={Gavel}
        title={t("pages.auctionsTitle")}
        subtitle={t("pages.auctionsSubtitle")}
        actions={
          <LinkButton href="/plates/new" variant="secondary" size="md">
            {t("nav.addPlate")}
          </LinkButton>
        }
      >
        <span className="tnum text-sm text-(--color-text-faint)">
          {t("pages.auctionsResultCount", { count: total })}
        </span>
      </PageHeader>

      <FilterBar
        className="mb-8"
        searchPlaceholder={t("common.search")}
        clearHref="/auctions"
        selects={[
          {
            key: "status",
            label: t("pages.filterStatus"),
            options: [
              { value: "live", label: t("auction.live") },
              { value: "scheduled", label: t("auction.scheduled") },
              { value: "completed", label: t("pages.statusCompleted") },
            ],
          },
          {
            key: "category",
            label: t("pages.filterCategory"),
            options: [{ value: "exclusive", label: t("pages.exclusiveOnlyFilter") }],
          },
          {
            key: "vip",
            label: t("auction.vipBadge"),
            options: [{ value: "true", label: t("pages.vipOnlyFilter") }],
          },
          {
            key: "plateType",
            label: t("pages.filterPlateType"),
            options: PLATE_TYPES.map((type) => ({ value: type, label: plateTypeLabel(type, locale) })),
          },
          {
            key: "sort",
            label: t("pages.sortLabel"),
            options: [
              { value: "ending", label: t("pages.sortEndingSoon") },
              { value: "newest", label: t("pages.sortNewest") },
              { value: "price_asc", label: t("pages.sortPriceAsc") },
              { value: "price_desc", label: t("pages.sortPriceDesc") },
            ],
          },
        ]}
      />

      {auctions.length > 0 ? (
        <>
          <AuctionGrid auctions={auctions} />
          <div className="mt-8 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
            <Pagination page={page} pages={pages} total={total} className="border-t-0" />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Gavel}
          title={t("pages.noMatchingAuctions")}
          description={t("pages.noMatchingAuctionsHint")}
          action={
            hasActiveFilters ? (
              <LinkButton href="/auctions" variant="secondary" size="md">
                {t("pages.clearFilters")}
              </LinkButton>
            ) : (
              <LinkButton href="/vip" variant="secondary" size="md">
                {t("home.vipPlates")}
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
