import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatDateTime, formatSar } from "@/lib/format";
import { plateTypeLabel } from "@/lib/constants";
import { plateDisplayName } from "@/lib/plateLabel";
import type { Locale } from "@/lib/i18n";
import type { AuctionSummary } from "@/types/auction";
import type { PlateDTO } from "@/types/dto";
import { cn } from "@/lib/cn";

type Translate = (key: string, params?: Record<string, string | number>) => string;

function PlateVisual({
  plate,
  locale,
  size = "md",
  className,
}: {
  plate: PlateDTO | AuctionSummary["plate"];
  locale: Locale;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const alt = plate.title ?? `${plate.lettersAr} ${plate.numbers}`;

  if (plate.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={plate.image} alt={alt} className={cn("h-full w-full object-contain", className)} />;
  }

  return (
    <SaudiPlate
      type={plate.type}
      lettersAr={plate.lettersAr}
      lettersEn={plate.lettersEn}
      numbers={plate.numbers}
      logo={plate.logo}
      size={size}
      vip={plate.isVip}
      locale={locale}
      className={className}
    />
  );
}

function EditorialHeader({
  title,
  subtitle,
  href,
  locale,
  t,
}: {
  title: string;
  subtitle: string;
  href: string;
  locale: Locale;
  t: Translate;
}) {
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-(--color-text-muted) sm:text-base">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-text-muted) transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
      >
        {t("home.viewAll")}
        <Arrow className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function CuratedVipSection({ plates, locale, t }: { plates: PlateDTO[]; locale: Locale; t: Translate }) {
  if (plates.length === 0) return null;
  const [featured, ...rest] = plates;

  return (
    <section className="mz-section">
      <div className="mz-container">
        <EditorialHeader
          title={t("home.vipPlates")}
          subtitle={t("home.vipPlatesSubtitle")}
          href="/vip"
          locale={locale}
          t={t}
        />

        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
          <Link
            href={`/listings/${featured._id}`}
            className="group relative min-h-[25rem] overflow-hidden rounded-(--radius-xl) border border-(--color-vip-border) bg-(--color-vip-surface) p-6 transition-[border-color,background-color] duration-(--duration-base) hover:border-(--color-gold)/60 hover:bg-(--color-surface-hover) sm:min-h-[31rem] sm:p-10"
          >
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="flex items-start justify-between gap-4">
                <Badge tone="vip">VIP</Badge>
                <span className="text-xs text-(--color-text-faint)">{plateTypeLabel(featured.type, locale)}</span>
              </div>
              <div className="flex min-h-40 flex-1 items-center justify-center py-6 sm:min-h-56">
                <PlateVisual plate={featured} locale={locale} size="xl" className="max-h-64 transition-transform duration-(--duration-slow) group-hover:scale-[1.025] sm:max-h-80" />
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-(--color-border) pt-5">
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-(--color-text)">{plateDisplayName(featured, locale)}</p>
                  <p className="mt-1 text-sm text-(--color-text-muted)">{plateTypeLabel(featured.type, locale)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-(--color-gold)">{t("home.exploreVip")}</span>
              </div>
            </div>
          </Link>

          <div className="divide-y divide-(--color-border) border-y border-(--color-border)">
            {rest.slice(0, 4).map((plate) => (
              <Link
                key={plate._id}
                href={`/listings/${plate._id}`}
                className="group grid min-h-28 grid-cols-[7rem_1fr_auto] items-center gap-4 py-4 transition-colors hover:bg-(--color-surface-hover) sm:grid-cols-[8rem_1fr_auto]"
              >
                <div className="flex h-16 items-center justify-center overflow-hidden rounded-(--radius-md) bg-(--color-bg)">
                  <PlateVisual plate={plate} locale={locale} size="sm" className="max-h-12 transition-transform duration-(--duration-base) group-hover:scale-[1.03]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-(--color-text)">{plateDisplayName(plate, locale)}</p>
                  <p className="mt-1 text-xs text-(--color-text-muted)">{plateTypeLabel(plate.type, locale)}</p>
                </div>
                <span className="text-(--color-text-faint) transition-colors group-hover:text-(--color-gold)">
                  {locale === "ar" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DirectSaleSection({ listings, locale, t }: { listings: PlateDTO[]; locale: Locale; t: Translate }) {
  if (listings.length === 0) return null;

  return (
    <section className="mz-section mz-section-surface">
      <div className="mz-container">
        <EditorialHeader
          title={t("home.marketplaceListings")}
          subtitle={t("home.marketplaceListingsSubtitle")}
          href="/listings"
          locale={locale}
          t={t}
        />

        <div className={cn("grid border-y border-(--color-border)", listings.length === 1 ? "lg:grid-cols-1" : listings.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
          {listings.slice(0, 3).map((listing) => (
            <Link
              key={listing._id}
              href={`/listings/${listing._id}`}
              className="group flex min-w-0 flex-col gap-6 border-b border-(--color-border) p-5 transition-colors hover:bg-(--color-surface-hover) sm:p-7 lg:border-b-0 lg:border-s"
            >
              <div className="flex aspect-[1.5/1] items-center justify-center overflow-hidden rounded-(--radius-lg) bg-(--color-bg)">
                <PlateVisual plate={listing} locale={locale} size="xl" className="max-h-[82%] transition-transform duration-(--duration-slow) group-hover:scale-[1.03]" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-(--color-text)">{plateDisplayName(listing, locale)}</p>
                  <p className="mt-1 text-sm text-(--color-text-muted)">{plateTypeLabel(listing.type, locale)}</p>
                </div>
                <span className="tnum shrink-0 text-lg font-bold text-(--color-gold)">{listing.price != null ? formatSar(listing.price, locale) : "-"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function dateParts(value: string, locale: Locale) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).formatToParts(date);
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "--",
    month: parts.find((part) => part.type === "month")?.value ?? "--",
    weekday: parts.find((part) => part.type === "weekday")?.value ?? "--",
  };
}

export function UpcomingSchedule({ auctions, locale, t }: { auctions: AuctionSummary[]; locale: Locale; t: Translate }) {
  if (auctions.length === 0) return null;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const RowArrow = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section className="mz-section">
      <div className="mz-container">
        <div
          className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <div className="max-w-2xl text-start">
            <h2 className="text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
              {t("home.upcomingAuctions")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-(--color-text-muted) sm:text-base">
              {t("home.upcomingAuctionsSubtitle")}
            </p>
          </div>
          <Link
            href="/auctions?status=scheduled"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-(--color-text-muted) transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
          >
            <span>{t("home.viewAll")}</span>
            <Arrow className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-3">
          {auctions.slice(0, 6).map((auction) => {
            const date = dateParts(auction.startAt, locale);
            return (
              <Link
                key={auction._id}
                href={`/auctions/${auction._id}`}
                dir={locale === "ar" ? "rtl" : "ltr"}
                className="group grid gap-5 rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-5 transition-[background-color,border-color] duration-(--duration-base) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover) sm:p-6 lg:grid-cols-[6rem_minmax(12rem,15rem)_minmax(0,1fr)_minmax(9rem,auto)_auto] lg:items-center lg:gap-8"
              >
                <div className="flex items-center justify-between gap-4 border-b border-(--color-border) pb-4 text-start lg:block lg:border-b-0 lg:border-e lg:pb-0 lg:pe-6 lg:text-center">
                  <div>
                    <span className="tnum block text-[2.35rem] font-black leading-none text-(--color-text)">
                      {date.day}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-(--color-gold)">{date.month}</span>
                    <span className="mt-1 block text-xs font-medium text-(--color-text-faint)">{date.weekday}</span>
                  </div>
                  <Badge tone="scheduled" className="lg:hidden">
                    {t("auction.scheduled")}
                  </Badge>
                </div>

                <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-(--radius-lg) bg-(--color-bg) px-4 py-5 lg:min-h-28 lg:px-5">
                  <PlateVisual
                    plate={auction.plate}
                    locale={locale}
                    size="md"
                    className="max-h-24 transition-transform duration-(--duration-base) group-hover:scale-[1.018] lg:max-h-20"
                  />
                </div>

                <div className="min-w-0 text-start">
                  <div className="mb-3 hidden lg:block">
                    <Badge tone="scheduled">{t("auction.scheduled")}</Badge>
                  </div>
                  <p className="truncate text-xl font-bold leading-tight text-(--color-text)">
                    {plateDisplayName(auction.plate, locale)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-(--color-text-muted)">
                    {plateTypeLabel(auction.plate.type, locale)}
                  </p>
                  <p className="mt-1 text-sm text-(--color-text-faint)">{formatDateTime(auction.startAt, locale)}</p>
                </div>

                <div className="border-t border-(--color-border) pt-5 text-start lg:border-t-0 lg:pt-0">
                  <p className="text-sm font-medium text-(--color-text-muted)">{t("auction.startingPrice")}</p>
                  <p className="tnum mt-2 whitespace-nowrap text-2xl font-black leading-none text-(--color-gold)">
                    {formatSar(auction.startingPrice, locale)}
                  </p>
                </div>

                <span className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border-strong) px-4 text-sm font-semibold text-(--color-text) transition-[border-color,color] group-hover:border-(--color-gold)/55 group-hover:text-(--color-gold) lg:justify-self-end">
                  <span>{t("home.viewAuction")}</span>
                  <RowArrow className="h-4 w-4 transition-transform duration-(--duration-base) group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CompletedResults({ auctions, locale, t }: { auctions: AuctionSummary[]; locale: Locale; t: Translate }) {
  if (auctions.length === 0) return null;

  return (
    <section className="mz-section mz-section-surface">
      <div className="mz-container">
        <EditorialHeader
          title={t("home.completedResults")}
          subtitle={t("home.completedResultsSubtitle")}
          href="/auctions?status=completed"
          locale={locale}
          t={t}
        />
        <div className="divide-y divide-(--color-border) border-y border-(--color-border)">
          {auctions.slice(0, 6).map((auction) => (
            <Link key={auction._id} href={`/auctions/${auction._id}`} className="group grid items-center gap-5 py-5 transition-colors hover:bg-(--color-surface-hover) sm:grid-cols-[9rem_1fr_auto_auto] sm:gap-7">
              <div className="flex h-14 items-center justify-center overflow-hidden rounded-(--radius-md) bg-(--color-bg)">
                <PlateVisual plate={auction.plate} locale={locale} size="sm" className="max-h-10 transition-transform duration-(--duration-base) group-hover:scale-[1.03]" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-(--color-text)">{plateDisplayName(auction.plate, locale)}</p>
                <p className="mt-1 text-sm text-(--color-text-muted)">{formatDateTime(auction.finalizedAt ?? auction.endAt, locale)}</p>
              </div>
              <div className="text-start sm:text-end">
                <p className="text-xs text-(--color-text-faint)">{t("auction.finalPrice")}</p>
                <p className="tnum mt-1 text-lg font-bold text-(--color-text)">{formatSar(auction.finalPrice ?? auction.currentPrice, locale)}</p>
              </div>
              <Badge tone={auction.status === "sold" || auction.status === "purchased" ? "success" : "neutral"} className="justify-self-start sm:justify-self-end">
                {auction.status === "sold" || auction.status === "purchased" ? t("auction.sold") : t("auction.unsold")}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFinalCta({ plate, locale, t }: { plate?: PlateDTO; locale: Locale; t: Translate }) {
  return (
    <section className="mz-section">
      <div className="mz-container">
        <div className="grid overflow-hidden rounded-(--radius-xl) border border-(--color-border-strong) bg-(--color-surface) lg:grid-cols-[1fr_0.8fr]">
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">{t("home.title")}</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-(--color-text-muted)">{t("home.subtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/plates/new" variant="gold" size="lg">{t("home.listYourPlate")}</LinkButton>
              <LinkButton href="/auctions" variant="outline" size="lg">{t("home.browseAuctions")}</LinkButton>
            </div>
          </div>
          <div className="flex min-h-64 items-center justify-center border-t border-(--color-border) bg-(--color-bg) p-8 lg:border-s lg:border-t-0">
            {plate ? <PlateVisual plate={plate} locale={locale} size="xl" className="max-h-48 sm:max-h-60" /> : <CheckCircle2 className="h-16 w-16 text-(--color-gold)" aria-hidden="true" />}
          </div>
        </div>
      </div>
    </section>
  );
}
