"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Crown, Gavel, UserRound } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
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

  const showcase = useMemo(() => buildShowcase(auctions), [auctions]);
  if (showcase.length === 0) return null;

  const auction = showcase[index % showcase.length];
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;
  const step = (delta: number) => setIndex((current) => (current + delta + showcase.length) % showcase.length);

  const currentPrice = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(auction.currentPrice);

  return (
    <div className="space-y-5">
      <div className="mb-2 flex items-end justify-between gap-4">
        <div className="flex items-center justify-end gap-3 text-right">
          <span className="inline-flex items-center rounded-full border border-(--color-live)/35 bg-(--color-live-bg) px-2.5 py-1 text-[11px] font-bold text-(--color-live) shadow-[0_0_12px_rgba(255,93,93,0.2)]">
            {t("auction.live")}
          </span>
          <div>
            <h2 className="text-3xl font-black leading-[1.1] text-(--color-text) sm:text-[2.6rem]">{t("home.liveAuctions")}</h2>
            <p className="mt-1 text-sm text-(--color-text-muted)">{t("home.liveAuctionsSubtitle")}</p>
          </div>
        </div>

        <Link
          href="/auctions?status=live"
          className="inline-flex items-center gap-2 text-base font-semibold text-(--color-gold) transition-colors hover:text-(--color-gold-hover)"
        >
          <span>{t("home.viewAll")}</span>
          <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
        </Link>
      </div>

      <div className="relative">
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(35,139,255,0.85)] bg-[#020d1a] shadow-[0_0_20px_rgba(20,110,255,0.12),inset_0_0_30px_rgba(255,255,255,0.015)]">
          <div className="relative grid min-h-[26rem] grid-cols-1 items-stretch gap-0 lg:grid-cols-[0.92fr_1.8fr_0.92fr]">
            <div className="flex flex-col justify-between border-b border-(--color-border) bg-[#050d18]/80 p-6 text-right lg:border-b-0 lg:border-l lg:border-(--color-border)">
              <div className="space-y-3">
                <div className="text-sm font-medium text-(--color-text-muted)">{t("auction.currentPrice")}</div>
                <div className="text-3xl font-black leading-none text-(--color-gold) sm:text-4xl">
                  {currentPrice}
                  <span className="mr-1 text-base font-medium text-(--color-gold)">{t("common.riyal")}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 text-sm text-(--color-text-muted)">
                <div className="flex items-center gap-2 rounded-full border border-(--color-border) bg-[#0b1727]/70 px-2.5 py-1.5">
                  <UserRound className="h-4 w-4 text-(--color-text-faint)" strokeWidth={2} />
                  <span className="tnum font-medium">{auction.highestBidder?.name ?? "مستخدم تجريبي 2"}</span>
                </div>
                <span className="text-(--color-border-strong)" aria-hidden="true">|</span>
                <div className="flex items-center gap-2 rounded-full border border-(--color-border) bg-[#0b1727]/70 px-2.5 py-1.5">
                  <Gavel className="h-4 w-4 text-(--color-text-faint)" strokeWidth={2} />
                  <span className="tnum font-medium">{t("auction.bidsCount", { count: auction.bidCount })}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href={`/auctions/${auction._id}`}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-(--color-border-strong) bg-[#0d1827]/80 px-4 text-sm font-semibold text-(--color-text) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold)"
                >
                  <span>{t("auction.auctionDetails")}</span>
                </Link>

                <Link
                  href={`/auctions/${auction._id}`}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-(--color-gold-hover) to-(--color-gold) px-4 text-sm font-black text-(--color-gold-foreground) shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_8px_18px_-8px_rgba(236,189,51,.72)] transition-transform hover:brightness-105 active:translate-y-px"
                >
                  <Gavel className="h-4 w-4" strokeWidth={2.2} />
                  <span>{t("auction.bidNow")}</span>
                </Link>
              </div>
            </div>

            <div
              className="relative flex items-end justify-center overflow-hidden bg-[#030d17] px-4 pb-0 pt-4"
              style={{
                backgroundImage: "url('/images/bg2.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,196,94,0.08),transparent_38%)]" />
              <div className="relative -top-[142px] z-10 flex w-full flex-col items-center justify-end pb-4 pt-2">
                {auction.plate.isVip && (
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-(--color-gold)/70 bg-black/70 px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-(--color-gold)">
                    <span>VIP</span>
                    <Crown className="h-3 w-3" strokeWidth={2.5} />
                  </div>
                )}

                <Link
                  href={`/auctions/${auction._id}`}
                  className="group block w-[66%] min-w-[16rem] max-w-[30rem] -translate-y-2 transition-transform duration-(--duration-base) hover:scale-[1.02]"
                >
                  <SaudiPlate
                    type={auction.plate.type}
                    lettersAr={auction.plate.lettersAr}
                    lettersEn={auction.plate.lettersEn}
                    numbers={auction.plate.numbers}
                    logo={auction.plate.logo}
                    size="xl"
                    vip={auction.plate.isVip}
                    locale={locale}
                    className="mx-auto"
                  />
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between border-t border-(--color-border) bg-[#050d18]/80 p-6 text-center lg:border-t-0 lg:border-r lg:border-(--color-border)">
              <div className="space-y-3">
                <div className="text-sm font-medium text-(--color-text-muted)">{t("auction.endsIn")}</div>
                <div className="flex items-center justify-center gap-2">
                  <CountdownTimer endAt={auction.endAt} variant="blocks" size="md" urgency className="justify-center" />
                </div>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-(--color-border-strong) bg-[#0d1827]/80 px-4 py-3 text-sm font-semibold text-(--color-text) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold)"
              >
                <Bell className="h-4 w-4" strokeWidth={2} />
                <span>{t("auction.endAlert")}</span>
              </button>
            </div>
          </div>
        </div>

        {showcase.length > 1 && (
          <>
            <IconButton
              onClick={() => step(-1)}
              aria-label={t("common.previous")}
              className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-(--color-border-strong)/80 bg-[#0a1420]/80 text-white shadow-[0_0_20px_rgba(10,20,32,0.56)] md:inline-flex"
            >
              <Prev className="h-5 w-5" aria-hidden="true" />
            </IconButton>
            <IconButton
              onClick={() => step(1)}
              aria-label={t("common.next")}
              className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-(--color-border-strong)/80 bg-[#0a1420]/80 text-white shadow-[0_0_20px_rgba(10,20,32,0.56)] md:inline-flex"
            >
              <Next className="h-5 w-5" aria-hidden="true" />
            </IconButton>
          </>
        )}
      </div>

      {showcase.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1" role="tablist" aria-label={t("home.liveAuctions")}>
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
                i === index ? "w-10 bg-(--color-gold)" : "w-2 bg-(--color-border-strong) hover:bg-(--color-text-faint)"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
