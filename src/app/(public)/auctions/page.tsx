import Link from "next/link";
import { Gavel, X } from "lucide-react";
import { getAuctionsList } from "@/lib/queries";
import { getServerTranslator } from "@/lib/i18n-server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { PLATE_TYPES, plateTypeLabel } from "@/lib/constants";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{
    status?: string;
    category?: string;
    vip?: string;
    plateType?: string;
    search?: string;
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
      page: params.page ? Number(params.page) : 1,
    }),
    getServerTranslator(),
  ]);

  const hasActiveFilters = Boolean(
    params.status || params.category || params.vip || params.plateType || params.search
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <SectionHeader title={t("pages.auctionsTitle")} subtitle={t("pages.auctionsSubtitle")} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterBar
          searchPlaceholder={t("common.search")}
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
          ]}
        />
        {hasActiveFilters && (
          <Link
            href="/auctions"
            className="flex items-center gap-1 text-sm font-medium text-(--color-text-muted) hover:text-(--color-danger) transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {t("pages.clearFilters")}
          </Link>
        )}
      </div>

      {auctions.length > 0 ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,300px))] justify-center gap-4">
            {auctions.map((a) => (
              <AuctionCard key={a._id} auction={a} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={page} pages={pages} total={total} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Gavel}
          title={t("pages.noMatchingAuctions")}
          description={t("pages.noMatchingAuctionsHint")}
          action={
            hasActiveFilters ? (
              <Link
                href="/auctions"
                className="text-sm font-medium text-(--color-gold) hover:text-(--color-gold-hover)"
              >
                {t("pages.clearFilters")}
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
