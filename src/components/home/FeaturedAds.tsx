"use client";

import Link from "next/link";

import { ChevronLeft, ChevronRight, Crown, Gem } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useAuctionRooms } from "@/hooks/useAuctionRooms";
import { useCarousel } from "@/hooks/useCarousel";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { plateClassificationLabel, plateTypeLabel, usageTypeLabel } from "@/lib/constants";
import { plateDisplayName } from "@/lib/plateLabel";
import type { PlateDTO } from "@/types/dto";
import type { AuctionSummary } from "@/types/auction";

/**
 * "الإعلانات المميزة" — the frosted warm-brown panel inside a gold frame.
 *
 * Membership is decided by the database, never by position in an array:
 * the plates are exactly those the query returned for `isVip: true` (and
 * past moderation), so clearing a plate's VIP flag in the admin removes
 * it from here on the next read.
 *
 * A card's price is the *live* one where the plate is currently under
 * auction — `liveAuctions` carries those, and this component joins their
 * realtime rooms so the figure tracks bids without a reload. A plate that
 * is neither under auction nor listed for sale has no price to show, and
 * that row is omitted rather than filled with a stand-in figure.
 *
 * Four cards sit across a desktop panel, stepping down to three, two, and
 * one-plus-a-peek as the viewport narrows; the same track then scrolls by
 * swipe, so a card is never shrunk just to keep four in frame.
 */
export function FeaturedAds({
  plates,
  liveAuctions,
}: {
  plates: PlateDTO[];
  liveAuctions: AuctionSummary[];
}) {
  const { t, locale } = useTranslations();


  const auctionByPlate = new Map(liveAuctions.map((auction) => [auction.plate._id, auction]));
  const { snapshotFor } = useAuctionRooms(liveAuctions.map((auction) => auction._id));

  const isArabic = locale === "ar";

  const { ref: scroller, pages, page, step, scrollToPage, canPrev, canNext } = useCarousel<HTMLDivElement>(
    isArabic,
    [plates.length, locale]
  );

  // "Previous" points back the way the text runs — a right chevron in
  // Arabic, a left one in English — and sits on the reading side.
  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <section className="relative" aria-labelledby="featured-ads-title">
      <div className="mz-panel-premium px-5 py-6 text-(--color-on-charcoal) sm:px-7 sm:py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* A bare metallic glyph — the tile that used to sit behind it
                made the mark read as a button rather than an emblem. */}
            <Gem
              className="h-9 w-9 shrink-0 text-(--color-gold) drop-shadow-[0_2px_6px_rgba(167,123,34,0.55)] sm:h-11 sm:w-11"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <div>
              <h2
                id="featured-ads-title"
                className="text-[1.4rem] font-bold leading-tight text-(--color-on-charcoal) sm:text-[1.65rem]"
              >
                {t("home.premiumTitle")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-(--color-gold) sm:text-[15px]">
                {t("home.premiumSubtitle")}
              </p>
            </div>
          </div>

          <Link
            href="/vip"
            className="inline-flex h-[42px] items-center rounded-[14px] border border-white/25 bg-white/3 px-6 text-sm font-semibold text-(--color-on-charcoal) transition-colors duration-(--duration-fast) hover:border-(--color-gold)/70 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        <div
          ref={scroller}
          className="mz-scroller flex gap-4 overflow-x-auto pb-1 pt-3.5 sm:gap-[18px]"
          role="list"
          aria-label={t("home.premiumTitle")}
        >
          {plates.map((plate) => {
            const auction = auctionByPlate.get(plate._id);
            const snapshot = auction ? snapshotFor(auction._id) : undefined;
            const price = snapshot?.currentPrice ?? auction?.currentPrice ?? plate.price;
            const href = auction ? `/auctions/${auction._id}` : `/listings/${plate._id}`;
            const name = plateDisplayName(plate, locale);

            return (
              <Link
                key={plate._id}
                href={href}
                role="listitem"
                aria-label={name}
                className={[
                  // Centred rather than spread: with no price to anchor the
                  // foot of the card, `flex-1` on the plate left it floating
                  // in a tall void instead of reading as the subject.
                  "mz-snap mz-card-ivory mz-hover-lift group relative flex shrink-0 flex-col justify-center gap-3.5",
                  "min-h-[11rem] rounded-[14px] px-3.5 pb-5 pt-7 text-(--color-text)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  // Widths derived from the track itself, so four land
                  // exactly flush at desktop and nothing is left dangling.
                  "w-[78%] sm:w-[calc((100%-18px)/2)] md:w-[calc((100%-36px)/3)] lg:w-[calc((100%-54px)/4)]",
                ].join(" ")}
              >
                <span className="mz-badge-gold absolute -top-3 end-3.5 inline-flex items-center gap-1.5 rounded-(--radius-pill) px-3 py-1 text-[12px] font-bold">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.4} />
                  {t("home.featuredBadge")}
                </span>

                {/* The plate is the card. Only its width is constrained —
                    never both axes, which would distort the glyphs. */}
                <div className="flex items-center justify-center">
                  {plate.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={plate.image}
                      alt={name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="max-h-24 w-[88%] object-contain"
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
                      className="w-[88%]"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#5d574f]">
                  <span className="rounded-(--radius-pill) bg-[#ece9e4] px-2.5 py-1">
                    {plate.usageType ? usageTypeLabel(plate.usageType, locale) : plateTypeLabel(plate.type, locale)}
                  </span>
                  {plate.classification && (
                    <span className="rounded-(--radius-pill) bg-[#ece9e4] px-2.5 py-1">
                      {plateClassificationLabel(plate.classification, locale)}
                    </span>
                  )}
                </div>

                {/* Omitted rather than faked when the record carries no
                    price: most VIP plates are admin-created and are neither
                    listed for sale nor under auction. */}
                {price != null && (
                  <div className="text-center">
                    <p className="tnum leading-none text-(--color-brand)">
                      <span className="text-[20px] font-bold">{formatNumber(price, locale)}</span>{" "}
                      <span className="text-[13px] font-semibold opacity-85">{t("common.riyal")}</span>
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#777067]">
                      {auction ? t("home.currentPrice") : t("pages.adPrice")}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* The dots answer "how much more is there?", which the arrows
            alone do not — and on a phone, where the arrows are the only
            other cue, they are what makes the track look scrollable. */}
        {pages > 1 && (
          <div
            className="mt-5 flex items-center justify-center gap-2"
            role="tablist"
            aria-label={t("home.premiumTitle")}
          >
            {Array.from({ length: pages }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === page}
                aria-label={`${index + 1}`}
                onClick={() => scrollToPage(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-(--duration-base)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  index === page ? "w-7 bg-(--color-gold)" : "w-2 bg-white/25 hover:bg-white/55"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Straddling the panel's edges and centred on the cards, rather
          than parked beside the header — they belong to the track. */}
      {pages > 1 && (
        <>
          <ArrowButton side="start" onClick={() => step(-1)} label={t("common.previous")} disabled={!canPrev}>
            <PrevIcon className="h-5 w-5" aria-hidden="true" strokeWidth={2.2} />
          </ArrowButton>
          <ArrowButton side="end" onClick={() => step(1)} label={t("common.next")} disabled={!canNext}>
            <NextIcon className="h-5 w-5" aria-hidden="true" strokeWidth={2.2} />
          </ArrowButton>
        </>
      )}
    </section>
  );
}

function ArrowButton({
  side,
  onClick,
  label,
  children,
}: {
  side: "start" | "end";
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "mz-carousel-arrow absolute top-[58%] z-20 hidden h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full",
        "transition-colors duration-(--duration-fast) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold) sm:inline-flex",
        side === "start" ? "start-0 -ms-5" : "end-0 -me-5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
