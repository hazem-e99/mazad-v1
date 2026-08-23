"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Crown, Gem } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useAuctionRooms } from "@/hooks/useAuctionRooms";
import { formatSar } from "@/lib/format";
import { plateClassificationLabel, plateTypeLabel, usageTypeLabel } from "@/lib/constants";
import { plateDisplayName } from "@/lib/plateLabel";
import type { PlateDTO } from "@/types/dto";
import type { AuctionSummary } from "@/types/auction";

/**
 * "الإعلانات المميزة" — the frosted charcoal panel.
 *
 * Membership is decided by the database, never by position in an array:
 * the plates are exactly those the query returned for `isVip: true` (and
 * past moderation), so clearing a plate's VIP flag in the admin removes
 * it from here on the next read.
 *
 * A card's price is the *live* one where the plate is currently under
 * auction — `liveAuctions` carries those, and this component joins their
 * realtime rooms so the figure tracks bids without a reload. A plate not
 * in an auction shows its marketplace asking price instead, and the label
 * changes with it rather than calling a fixed price "current".
 */
export function FeaturedAds({
  plates,
  liveAuctions,
}: {
  plates: PlateDTO[];
  liveAuctions: AuctionSummary[];
}) {
  const { t, locale } = useTranslations();
  const scroller = useRef<HTMLDivElement>(null);

  const auctionByPlate = new Map(liveAuctions.map((auction) => [auction.plate._id, auction]));
  const { snapshotFor } = useAuctionRooms(liveAuctions.map((auction) => auction._id));

  const isArabic = locale === "ar";
  // The scroller runs in the document's own direction, so "previous" is a
  // negative scroll in LTR and a positive one in RTL.
  const step = (direction: -1 | 1) => {
    const node = scroller.current;
    if (!node) return;
    const amount = Math.max(240, node.clientWidth * 0.6) * direction * (isArabic ? -1 : 1);
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  const Prev = isArabic ? ChevronRight : ChevronLeft;
  const Next = isArabic ? ChevronLeft : ChevronRight;

  return (
    <section
      className="mz-panel-premium rounded-(--radius-xl) p-5 text-(--color-on-charcoal) sm:p-7"
      aria-labelledby="featured-ads-title"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-gold)/15 text-(--color-gold)"
            aria-hidden="true"
          >
            <Gem className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 id="featured-ads-title" className="text-xl font-bold text-(--color-on-charcoal) sm:text-2xl">
              {t("home.premiumTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-(--color-on-charcoal-muted) sm:text-sm">{t("home.premiumSubtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vip"
            className="inline-flex h-10 items-center rounded-(--radius-pill) border border-white/20 px-4 text-xs font-semibold text-(--color-on-charcoal) transition-colors hover:border-(--color-gold)/60 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:text-sm"
          >
            {t("home.viewAll")}
          </Link>
          {plates.length > 1 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <CarouselButton onClick={() => step(-1)} label={t("common.previous")}>
                <Prev className="h-4 w-4" aria-hidden="true" />
              </CarouselButton>
              <CarouselButton onClick={() => step(1)} label={t("common.next")}>
                <Next className="h-4 w-4" aria-hidden="true" />
              </CarouselButton>
            </div>
          )}
        </div>
      </div>

      <div
        ref={scroller}
        className="mz-scroller -mx-1 flex gap-4 overflow-x-auto px-1 pb-1"
        role="list"
        aria-label={t("home.premiumTitle")}
      >
        {plates.map((plate) => {
          const auction = auctionByPlate.get(plate._id);
          const snapshot = auction ? snapshotFor(auction._id) : undefined;
          const price = snapshot?.currentPrice ?? auction?.currentPrice ?? plate.price;
          const href = auction ? `/auctions/${auction._id}` : `/listings/${plate._id}`;

          return (
            <Link
              key={plate._id}
              href={href}
              role="listitem"
              className="mz-snap mz-hover-lift group flex w-[17.5rem] shrink-0 flex-col gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:w-[18.5rem]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-(--color-gold-tint) px-2.5 py-1 text-[11px] font-bold text-(--color-gold-dark)">
                  <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.4} />
                  {t("home.featuredBadge")}
                </span>
              </div>

              <div className="flex min-h-[5rem] items-center justify-center">
                {plate.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plate.image}
                    alt={plateDisplayName(plate, locale)}
                    className="max-h-20 w-full object-contain"
                  />
                ) : (
                  <SaudiPlate
                    type={plate.type}
                    lettersAr={plate.lettersAr}
                    lettersEn={plate.lettersEn}
                    numbers={plate.numbers}
                    logo={plate.logo}
                    size="xl"
                    vip
                    locale={locale}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-(--color-text-muted)">
                <span className="rounded-(--radius-sm) bg-(--color-surface-secondary) px-2 py-1">
                  {plate.usageType ? usageTypeLabel(plate.usageType, locale) : plateTypeLabel(plate.type, locale)}
                </span>
                {plate.classification && (
                  <span className="rounded-(--radius-sm) bg-(--color-surface-secondary) px-2 py-1">
                    {plateClassificationLabel(plate.classification, locale)}
                  </span>
                )}
              </div>

              {/* A VIP plate that is neither under auction nor listed for
                  sale genuinely has no price — most are admin-created
                  records, not marketplace submissions. The slot shows the
                  plate's own identity in that case rather than a dash
                  standing in for a figure that does not exist. */}
              <div className="mt-auto border-t border-(--color-border) pt-3 text-center">
                {price != null ? (
                  <>
                    <p className="tnum text-lg font-bold text-(--color-brand)">{formatSar(price, locale)}</p>
                    <p className="mt-0.5 text-[11px] text-(--color-text-faint)">
                      {auction ? t("home.currentPrice") : t("pages.adPrice")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="truncate text-base font-bold text-(--color-text)">
                      {plateDisplayName(plate, locale)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-(--color-text-faint)">{t("home.exploreVip")}</p>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CarouselButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-(--color-on-charcoal) transition-colors hover:border-(--color-gold)/60 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
    >
      {children}
    </button>
  );
}
