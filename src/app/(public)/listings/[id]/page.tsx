import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Crown, Tag } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import "@/models/PlateLogo";
import "@/models/PlateCategory";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime, formatNumber } from "@/lib/format";
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
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { plateDisplayName } from "@/lib/plateLabel";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * A single plate.
 *
 * The page is built around the plate itself: one stage across the reading
 * side carrying it at full size, the identity and commerce column beside
 * it, and the specification table underneath. Everything on it comes from
 * the record — the previous layout reserved a 4:3 photo frame for a 5:1
 * subject, which left most of the page empty whichever way the plate was
 * drawn.
 */
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
  const name = plateDisplayName(listing, locale);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

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
      ? `Hi, I'm reaching out about the plate "${name}" listed on Mazad.`
      : `مرحبًا، أتواصل بخصوص اللوحة "${name}" المعروضة على منصة مزاد.`;

  return (
    <div className="mz-container py-10 sm:py-14">
      <Link
        href="/listings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-(--color-text-muted) transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      >
        <Back className="h-4 w-4" aria-hidden="true" />
        {t("nav.marketplace")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* ── Stage ─────────────────────────────────────────────────────
            Height-driven, not aspect-driven: a plate is a wide, thin
            subject, so a tall frame around it is all void. */}
        <div
          className={[
            "relative flex min-h-[16rem] items-center justify-center overflow-hidden rounded-(--radius-xl) p-6 sm:min-h-[19rem] sm:p-10",
            listing.isVip
              ? "border border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow)"
              : "border border-(--color-border) bg-(--color-bg-elevated) shadow-(--shadow-soft)",
          ].join(" ")}
        >
          {listing.isVip && (
            <span
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,var(--color-gold-tint),transparent_70%)]"
              aria-hidden="true"
            />
          )}

          <PlatePhoto
            src={listing.image}
            alt={name}
            className="relative max-h-64 w-full object-contain"
            fallback={
              <SaudiPlate
                type={listing.type}
                lettersAr={listing.lettersAr}
                lettersEn={listing.lettersEn}
                numbers={listing.numbers}
                logo={listing.logo}
                size="xl"
                vip={listing.isVip}
                locale={locale}
                className="relative"
              />
            }
          />
        </div>

        {/* ── Identity + commerce ───────────────────────────────────── */}
        <div className="flex flex-col rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-6 shadow-(--shadow-soft) sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {listing.isVip && (
              <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-(--color-gold-tint) px-3 py-1 text-xs font-bold text-(--color-gold-dark)">
                <Crown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.4} />
                VIP
              </span>
            )}
            {isForSale && (
              <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-(--color-primary-soft) px-3 py-1 text-xs font-bold text-(--color-brand)">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} />
                {t("pages.forSaleBadge")}
              </span>
            )}
          </div>

          {/* A plate that was never a listing has no title of its own —
              its letters and numbers are its name. */}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">{name}</h1>

          <p className="mt-2 text-sm text-(--color-text-muted)">
            {[
              plateTypeLabel(listing.type, locale),
              listing.classification && plateClassificationLabel(listing.classification, locale),
              listing.usageType && usageTypeLabel(listing.usageType, locale),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {listing.price != null && (
            <p className="tnum mt-6 leading-none text-(--color-brand)">
              <span className="text-4xl font-bold">{formatNumber(listing.price, locale)}</span>{" "}
              <span className="text-lg font-semibold opacity-85">{t("common.riyal")}</span>
            </p>
          )}

          {listing.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-(--color-text-muted)">
              {listing.description}
            </p>
          )}

          {isForSale && (
            <div className="mt-7">
              <WhatsAppContactButton contactPhone={listing.contactPhone} message={message} />
            </div>
          )}

          <p className="mt-auto flex items-center gap-2 pt-7 text-xs text-(--color-text-faint)">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.8} />
            {formatDateTime(listing.createdAt, locale)}
          </p>
        </div>
      </div>

      {/* ── Specification table ───────────────────────────────────────
          Ruled rows rather than a loose grid: each fact is a label/value
          pair, and the rules are what let the eye scan down the column. */}
      <section className="mt-6 overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) sm:mt-8">
        <h2 className="border-b border-(--color-border) px-6 py-4 text-base font-bold text-(--color-text) sm:px-8">
          {t("pages.listingDetailsHeader")}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec, index) => (
            <div
              key={spec.label}
              className={[
                "flex flex-col gap-1 px-6 py-4 sm:px-8",
                // Rules between cells, never around the block.
                index > 0 ? "border-t border-(--color-border)" : "",
                index % 2 === 1 ? "sm:border-s sm:border-(--color-border)" : "",
                index < 2 ? "sm:border-t-0" : "",
                index % 3 !== 0 ? "lg:border-s lg:border-(--color-border)" : "lg:border-s-0",
                index < 3 ? "lg:border-t-0" : "lg:border-t",
              ].join(" ")}
            >
              <dt className="text-xs text-(--color-text-faint)">{spec.label}</dt>
              <dd className="text-sm font-medium text-(--color-text)">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
