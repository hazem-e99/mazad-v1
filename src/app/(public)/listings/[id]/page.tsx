import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  plateClassificationLabel,
  usageTypeLabel,
  plateShapeLabel,
  plateSizeLabel,
  plateTypeLabel,
} from "@/lib/constants";
import { toPlateDTO, type LeanPlate } from "@/lib/dto";
import { WhatsAppContactButton } from "@/components/plate/WhatsAppContactButton";
import { PlatePhoto } from "@/components/plate/PlatePhoto";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const doc = await Plate.findById(id).populate("logo").populate("category").lean<LeanPlate>();

  // The public-plate rule, the same one getVipPlates and GET /api/plates
  // apply: visible, and not sitting in (or rejected by) review. It is
  // deliberately wider than "is a marketplace listing" — the home page and
  // /vip both publish admin-created VIP plates, which carry no
  // `submissionType` at all, and requiring one here meant every one of
  // those cards led to a 404.
  //
  // Nothing new becomes public: a pending or rejected submission is still
  // refused, as is a hidden plate.
  if (!doc || !doc.isVisible || doc.moderationStatus === "pending" || doc.moderationStatus === "rejected") {
    notFound();
  }

  const listing = toPlateDTO(doc);

  // Only a real marketplace submission is *for sale*; an admin-created VIP
  // plate is a catalogue entry with no price and no seller to contact, so
  // the commerce parts of this page are gated on that rather than rendered
  // empty.
  const isForSale = listing.submissionType === "marketplace";

  const specs: { label: string; value: string | null }[] = [
    { label: t("pages.classificationLabel"), value: listing.classification ? plateClassificationLabel(listing.classification, locale) : null },
    { label: t("pages.usageTypeLabel"), value: listing.usageType ? usageTypeLabel(listing.usageType, locale) : null },
    { label: t("pages.shapeLabel"), value: listing.shape ? plateShapeLabel(listing.shape, locale) : null },
    { label: t("pages.sizeLabel"), value: listing.size ? plateSizeLabel(listing.size, locale) : null },
    { label: t("pages.categoryLabel"), value: listing.category ? (locale === "en" ? listing.category.nameEn : listing.category.nameAr) : null },
    { label: t("pages.plateTypeLabel"), value: plateTypeLabel(listing.type, locale) },
    { label: t("pages.plateLogoLabel"), value: listing.logo ? (locale === "en" ? listing.logo.nameEn : listing.logo.nameAr) : t("pages.noLogoOption") },
  ].filter((s) => s.value);

  const message =
    locale === "en"
      ? `Hi, I'm reaching out about the plate "${listing.title}" listed on Mazad.`
      : `مرحبًا، أتواصل بخصوص اللوحة "${listing.title}" المعروضة على منصة مزاد.`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-(--color-bg-elevated)">
            <PlatePhoto
              src={listing.image}
              alt={listing.title ?? ""}
              className="h-full w-full object-contain p-4"
              fallback={null}
            />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {listing.isVip && <Badge tone="vip">VIP</Badge>}
              <Badge tone="neutral">{t("pages.forSaleBadge")}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-(--color-text)">{listing.title}</h1>
            <p className="tnum text-3xl font-bold text-(--color-gold) mt-2">{listing.price != null ? formatSar(listing.price, locale) : "—"}</p>
          </div>

          {listing.description && <p className="text-sm text-(--color-text-muted) whitespace-pre-line">{listing.description}</p>}

          <WhatsAppContactButton contactPhone={listing.contactPhone} message={message} />

          <p className="text-xs text-(--color-text-faint)">{formatDateTime(listing.createdAt, locale)}</p>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold text-(--color-text) mb-4">{t("pages.listingDetailsHeader")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {specs.map((s) => (
              <div key={s.label}>
                <p className="text-(--color-text-faint) text-xs">{s.label}</p>
                <p className="text-(--color-text)">{s.value}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
