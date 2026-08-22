"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Crown, Gavel, UserRound } from "lucide-react";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { IconButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { AuctionSummary } from "@/types/auction";

const buildShowcase = (auctions: AuctionSummary[]) => {
  if (auctions.length === 0) return [];

  const padded: AuctionSummary[] = [...auctions];
  while (padded.length < 5) {
    const source = auctions[padded.length % auctions.length];
    padded.push({ ...source, _id: `${source._id}-${padded.length}` });
  }

  return padded;
};

export function LiveAuctionSpotlight({ auctions }: { auctions: AuctionSummary[] }) {
  const { t, locale } = useTranslations();
  const [index, setIndex] = useState(0);
  const isArabic = locale === "ar";

  const showcase = useMemo(() => buildShowcase(auctions), [auctions]);
  if (showcase.length === 0) return null;

  const auction = showcase[index % showcase.length];
  const Prev = isArabic ? ChevronRight : ChevronLeft;
  const Next = isArabic ? ChevronLeft : ChevronRight;
  const step = (delta: number) => setIndex((current) => (current + delta + showcase.length) % showcase.length);

  const currentPrice = new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(auction.currentPrice);

  return (
    <section className="space-y-8">
      <div
        className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="text-start">
          <h2 className="mz-display text-3xl text-(--color-text) sm:text-[2.8rem]">{t("home.liveAuctions")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-(--color-text-muted)">{t("home.liveAuctionsSubtitle")}</p>
        </div>

        <Link
          href="/auctions?status=live"
          className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-(--color-gold) transition-colors hover:text-(--color-gold-hover) sm:inline-flex"
        >
          <span>{t("home.viewAll")}</span>
          <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
        </Link>
      </div>

      <div className="relative overflow-hidden border-y border-(--color-border-strong) bg-(--color-surface)" dir="ltr">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_52%,rgba(215,173,88,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%,rgba(0,0,0,0.18))] opacity-70"
          aria-hidden="true"
        />

        <div
          className={cn(
            "relative grid grid-cols-1",
            isArabic
              ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]"
              : "lg:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.4fr)]"
          )}
        >
          <div
            className={cn(
              "relative order-1 flex min-h-[25rem] items-center justify-center overflow-hidden border-b border-(--color-border) bg-(--color-bg) px-4 py-12 sm:min-h-[30rem] sm:px-10 lg:min-h-[34rem] lg:border-b-0",
              isArabic ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1"
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-55"
              style={{
                backgroundImage: "url('/images/bg2.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(215,173,88,0.10),transparent_42%),linear-gradient(180deg,rgba(0,0,0,0.18),transparent_35%,rgba(0,0,0,0.36))]"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-(--color-bg) to-transparent" aria-hidden="true" />

            <div className="relative z-10 flex w-full max-w-[46rem] flex-col items-center gap-7 pb-14">
              {auction.plate.isVip && (
                <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-(--color-gold)">
                  <Crown className="h-3.5 w-3.5" strokeWidth={2.2} />
                  <span>VIP</span>
                </div>
              )}
              <Link
                href={`/auctions/${auction._id}`}
                className="group block w-full transition-transform duration-(--duration-base) hover:scale-[1.012]"
              >
                <SaudiPlate
                  type={auction.plate.type}
                  lettersAr={auction.plate.lettersAr}
                  lettersEn={auction.plate.lettersEn}
                  numbers={auction.plate.numbers}
                  logo={auction.plate.logo}
                  size="spotlight"
                  vip={auction.plate.isVip}
                  locale={locale}
                  className="mx-auto"
                />
              </Link>
              <p className="max-w-full truncate text-xs tracking-[0.14em] text-(--color-text-faint)">
                {auction.plate.title}
              </p>
            </div>

            {showcase.length > 1 && (
              <div
                className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center"
                dir={isArabic ? "rtl" : "ltr"}
                aria-label={t("home.liveAuctions")}
              >
                <div className="flex items-center gap-3 border border-(--color-border) bg-black/25 px-3 py-2 backdrop-blur-md">
                  <IconButton
                    onClick={() => step(-1)}
                    aria-label={t("common.previous")}
                    size="sm"
                    className="border-transparent bg-transparent text-(--color-text) hover:bg-white/5"
                  >
                    <Prev className="h-4.5 w-4.5" aria-hidden="true" />
                  </IconButton>

                  <div className="flex items-center gap-1.5" role="tablist" aria-label={t("home.liveAuctions")}>
                    {showcase.map((item, i) => (
                      <button
                        key={`${item._id}-${i}`}
                        type="button"
                        role="tab"
                        aria-selected={i === index}
                        aria-label={`${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-(--duration-base)",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                          i === index ? "w-7 bg-(--color-gold)" : "w-1.5 bg-white/25 hover:bg-white/55"
                        )}
                      />
                    ))}
                  </div>

                  <IconButton
                    onClick={() => step(1)}
                    aria-label={t("common.next")}
                    size="sm"
                    className="border-transparent bg-transparent text-(--color-text) hover:bg-white/5"
                  >
                    <Next className="h-4.5 w-4.5" aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              "order-2 flex flex-col justify-center p-6 text-start sm:p-8 lg:row-start-1 lg:p-10 xl:p-12",
              isArabic ? "lg:col-start-2 lg:border-l" : "lg:col-start-1 lg:border-r"
            )}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="mx-auto w-full max-w-[25rem] lg:mx-0">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-live)">
                  <span className="h-2 w-2 rounded-full bg-(--color-live)" aria-hidden="true" />
                  {t("auction.live")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.16em] text-(--color-gold)">
                  {auction.plate.isVip && <Crown className="h-3.5 w-3.5" strokeWidth={2.1} />}
                  <span>{auction.plate.isVip ? "VIP" : t("auction.auction")}</span>
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-(--color-text-faint)">{auction.plate.type}</p>

              <h3 className="mt-3 text-2xl font-bold leading-tight text-(--color-text) sm:text-[2rem]">
                {auction.plate.title}
              </h3>

              <div className="mt-8 border-t border-(--color-border) pt-7">
                <p className="text-sm font-medium text-(--color-text-muted)">{t("auction.currentPrice")}</p>
                <div className="mt-3 flex items-baseline gap-2 text-(--color-gold)">
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: "isolate" }}
                    className="tnum text-[clamp(2.7rem,4vw,3.55rem)] font-black leading-none tracking-tight"
                  >
                    {currentPrice}
                  </span>
                  <span className="text-base font-semibold text-(--color-text-muted)">{t("common.riyal")}</span>
                </div>
              </div>

              <div className="mt-7 border-t border-(--color-border) pt-6">
                <p className="mb-4 text-sm font-medium text-(--color-text-muted)">{t("auction.endsIn")}</p>
                <CountdownTimer endAt={auction.endAt} variant="blocks" size="md" urgency className="justify-start gap-2" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-5 border-t border-(--color-border) pt-5 text-sm text-(--color-text-muted)">
                <div className="min-w-0">
                  <span className="mb-1.5 inline-flex items-center gap-2 text-(--color-text-faint)">
                    <Gavel className="h-4 w-4" strokeWidth={2} />
                    <span>{t("auction.bidsLabel")}</span>
                  </span>
                  <p className="tnum truncate font-semibold text-(--color-text)">
                    {t("auction.bidsCount", { count: auction.bidCount })}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="mb-1.5 inline-flex items-center gap-2 text-(--color-text-faint)">
                    <UserRound className="h-4 w-4" strokeWidth={2} />
                    <span>{t("auction.highestBidder")}</span>
                  </span>
                  <p className="truncate font-semibold text-(--color-text)">
                    {auction.highestBidder?.name ?? t("auction.highestBidder")}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  href={`/auctions/${auction._id}`}
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-(--radius-md) bg-(--color-gold) px-5 text-sm font-black text-(--color-gold-foreground) transition-[background-color,transform] hover:-translate-y-px hover:bg-(--color-gold-hover) active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                >
                  <Gavel className="h-4 w-4" strokeWidth={2.2} />
                  <span>{t("auction.bidNow")}</span>
                </Link>
                <Link
                  href={`/auctions/${auction._id}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-(--radius-md) border border-(--color-border-strong) px-5 text-sm font-semibold text-(--color-text) transition-colors hover:border-(--color-gold)/60 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                >
                  {t("auction.auctionDetails")}
                </Link>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 py-2.5 text-xs font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.8} />
                  <span>{t("auction.endAlert")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
