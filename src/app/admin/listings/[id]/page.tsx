import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/User";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatSar, formatDateTime } from "@/lib/format";
import {
  plateTypeLabel,
  plateClassificationLabel,
  usageTypeLabel,
  plateShapeLabel,
  plateSizeLabel,
} from "@/lib/constants";
import { toPlateListingDTO, type LeanPlate } from "@/lib/dto";
import { ListingModerationActions } from "../ListingModerationActions";

export const revalidate = 0;

const statusTone: Record<string, "scheduled" | "sold" | "unsold"> = {
  pending: "scheduled",
  approved: "sold",
  rejected: "unsold",
};

interface Props {
  params: Promise<{ id: string }>;
}

/** A single labelled value inside one of the detail cards. `numeric` opts
 * into tabular figures so prices and plate numbers line up column-wise. */
function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="bg-(--color-bg-elevated) p-4">
      <dt className="text-xs text-(--color-text-faint)">{label}</dt>
      <dd className={"mt-1 font-medium break-words text-(--color-text) " + (numeric ? "tnum" : "")}>{value}</dd>
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-border) sm:grid-cols-2">
      {children}
    </dl>
  );
}

export default async function AdminListingDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  // `+ownershipDocument` is select:false on the schema — it is read here
  // only to decide whether to render the protected download link. The raw
  // path never leaves the server: toPlateListingDTO reduces it to a
  // boolean, and the bytes are served by the authorizing route.
  const doc = await Plate.findById(id)
    .select("+ownershipDocument")
    .populate("logo")
    .populate("category")
    .populate("ownerUser", "name phone")
    .lean<LeanPlate>();
  if (!doc) notFound();

  const listing = toPlateListingDTO(doc);
  const status = listing.moderationStatus ?? "pending";
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const dash = "—";

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/listings"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-gold)"
        >
          <Back className="h-4 w-4" aria-hidden="true" />
          {t("admin.backToListingsQueue")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.listingDetailTitle")}</h1>
            <p className="mt-1 text-sm text-(--color-text-muted)">{t("admin.listingDetailSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[status]}>{t(`pages.moderationStatus_${status}`)}</Badge>
            <Badge tone="neutral">
              {listing.submissionType === "auction_request"
                ? t("pages.submissionTypeAuctionRequest")
                : t("pages.submissionTypeMarketplace")}
            </Badge>
            {listing.isVip && <Badge tone="vip">VIP</Badge>}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.listingModerationHeader")}</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {status === "rejected" && listing.rejectionReason && (
            <p className="text-sm text-(--color-danger)">
              {t("pages.rejectionReasonLabel")}: {listing.rejectionReason}
            </p>
          )}
          {listing.submissionType ? (
            <ListingModerationActions listing={listing} />
          ) : (
            <p className="text-sm text-(--color-text-muted)">{t("admin.listingNotModeratable")}</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("admin.listingMediaHeader")}</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs text-(--color-text-faint)">{t("admin.uploadedPlatePhoto")}</p>
              {listing.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.image}
                  alt={t("admin.uploadedPlatePhoto")}
                  className="max-h-72 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) object-contain"
                />
              ) : (
                <p className="rounded-(--radius-md) border border-dashed border-(--color-border-strong) p-6 text-center text-sm text-(--color-text-muted)">
                  {t("pages.noImage")}
                </p>
              )}
            </div>

            {listing.hasOwnershipDocument ? (
              <a
                href={`/api/plates/${listing._id}/ownership-document`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) px-3 py-2 text-sm text-(--color-gold) transition-colors hover:border-(--color-gold)/50"
              >
                <FileText className="h-4 w-4" aria-hidden="true" strokeWidth={1.75} />
                {t("admin.openOwnershipDocument")}
              </a>
            ) : (
              <p className="text-sm text-(--color-text-muted)">{t("admin.noOwnershipDocument")}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("admin.listingPlateHeader")}</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="flex justify-center">
              <SaudiPlate
                type={listing.type}
                lettersAr={listing.lettersAr}
                lettersEn={listing.lettersEn}
                numbers={listing.numbers}
                logo={listing.logo}
                size="md"
                locale={locale}
              />
            </div>
            <DetailGrid>
              <Row label={t("pages.reviewPlateType")} value={plateTypeLabel(listing.type, locale)} />
              <Row label={t("pages.reviewLetters")} value={`${listing.lettersAr} · ${listing.lettersEn}`} />
              <Row label={t("pages.reviewNumbers")} value={listing.numbers} numeric />
              <Row
                label={t("pages.reviewLogo")}
                value={listing.logo ? (locale === "en" ? listing.logo.nameEn : listing.logo.nameAr) : t("pages.noLogoOption")}
              />
              <Row
                label={t("pages.classificationLabel")}
                value={listing.classification ? plateClassificationLabel(listing.classification, locale) : t("pages.notSpecified")}
              />
              <Row
                label={t("pages.usageTypeLabel")}
                value={listing.usageType ? usageTypeLabel(listing.usageType, locale) : t("pages.notSpecified")}
              />
              <Row
                label={t("pages.shapeLabel")}
                value={listing.shape ? plateShapeLabel(listing.shape, locale) : t("pages.notSpecified")}
              />
              <Row
                label={t("pages.sizeLabel")}
                value={listing.size ? plateSizeLabel(listing.size, locale) : t("pages.notSpecified")}
              />
              <Row
                label={t("pages.categoryLabel")}
                value={
                  listing.category ? (locale === "en" ? listing.category.nameEn : listing.category.nameAr) : t("pages.notSpecified")
                }
              />
            </DetailGrid>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("pages.listingDetailsHeader")}</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <DetailGrid>
            <Row label={t("pages.titleLabel")} value={listing.title ?? dash} />
            <Row
              label={t("pages.askingPriceLabel")}
              value={listing.price != null ? formatSar(listing.price, locale) : dash}
              numeric
            />
          </DetailGrid>
          <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-4">
            <p className="text-xs text-(--color-text-faint)">{t("pages.descriptionLabel")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-(--color-text)">{listing.description ?? dash}</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("pages.contactInfoHeader")}</h2>
          </CardHeader>
          <CardBody>
            <DetailGrid>
              <Row label={t("pages.contactPhoneLabel")} value={listing.contactPhone ?? dash} numeric />
              <Row label={t("pages.contactEmailLabel")} value={listing.contactEmail ?? dash} />
              <Row label={t("pages.instagramLabel")} value={listing.instagram ?? dash} />
              <Row label={t("pages.tiktokLabel")} value={listing.tiktok ?? dash} />
              <Row label={t("pages.snapchatLabel")} value={listing.snapchat ?? dash} />
            </DetailGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-(--color-text)">{t("admin.listingSubmitterHeader")}</h2>
          </CardHeader>
          <CardBody>
            <DetailGrid>
              <Row label={t("admin.colName")} value={listing.owner?.name || dash} />
              <Row label={t("admin.colPhone")} value={listing.owner?.phone || dash} numeric />
              <Row label={t("admin.submittedAtLabel")} value={formatDateTime(listing.createdAt, locale)} />
              <Row label={t("admin.lastUpdatedLabel")} value={formatDateTime(listing.updatedAt, locale)} />
            </DetailGrid>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
