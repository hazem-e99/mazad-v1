import { connectDB } from "@/lib/db";
import { Store } from "lucide-react";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { PlateCategory } from "@/models/PlateCategory";
import { ListingCard } from "@/components/plate/ListingCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerTranslator } from "@/lib/i18n-server";
import { PLATE_CLASSIFICATIONS, plateClassificationLabel, USAGE_TYPES, usageTypeLabel } from "@/lib/constants";
import { toPlateDTOList, toPlateCategoryDTOList, type LeanPlate, type LeanPlateCategory } from "@/lib/dto";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{
    classification?: string;
    usageType?: string;
    category?: string;
    vip?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 12;
  const filter: Record<string, unknown> = { submissionType: "marketplace", moderationStatus: "approved", isVisible: true };
  if (params.classification) filter.classification = params.classification;
  if (params.usageType) filter.usageType = params.usageType;
  if (params.category) filter.category = params.category;
  if (params.vip === "true") filter.isVip = true;
  if (params.search) {
    filter.$or = [
      { title: { $regex: params.search, $options: "i" } },
      { lettersEn: { $regex: params.search, $options: "i" } },
      { lettersAr: { $regex: params.search, $options: "i" } },
      { numbers: { $regex: params.search, $options: "i" } },
    ];
  }

  const [docs, total, categoryDocs] = await Promise.all([
    Plate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("logo")
      .populate("category")
      .lean<LeanPlate[]>(),
    Plate.countDocuments(filter),
    PlateCategory.find({ isActive: true }).sort({ sortOrder: 1 }).lean<LeanPlateCategory[]>(),
  ]);
  const listings = toPlateDTOList(docs);
  const categories = toPlateCategoryDTOList(categoryDocs);
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mz-container py-10 sm:py-12">
      <PageHeader icon={Store} title={t("pages.marketplaceTitle")} subtitle={t("pages.marketplaceSubtitle")} />

      <div className="mb-10">
        <FilterBar
          searchPlaceholder={t("pages.searchListingsPlaceholder")}
          selects={[
            {
              key: "classification",
              label: t("pages.classificationLabel"),
              options: PLATE_CLASSIFICATIONS.map((c) => ({ value: c, label: plateClassificationLabel(c, locale) })),
            },
            {
              key: "usageType",
              label: t("pages.usageTypeLabel"),
              options: USAGE_TYPES.map((u) => ({ value: u, label: usageTypeLabel(u, locale) })),
            },
            {
              key: "category",
              label: t("pages.categoryLabel"),
              options: categories.map((c) => ({ value: c._id, label: locale === "en" ? c.nameEn : c.nameAr })),
            },
            { key: "vip", label: t("admin.colVip"), options: [{ value: "true", label: t("admin.filterVipOnly") }] },
          ]}
        />
      </div>

      {listings.length === 0 ? (
        <EmptyState title={t("pages.noMatchingListings")} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={page} pages={pages} total={total} />
          </div>
        </>
      )}
    </div>
  );
}
