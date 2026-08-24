"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Hash } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import { formatSar } from "@/lib/format";
import { plateClassificationLabel } from "@/lib/constants";
import type { PlateDTO } from "@/types/dto";
import type { FeaturedNumberAuctionLink } from "@/lib/queries";

interface Props {
  vipPlates: PlateDTO[];
  normalPlates: PlateDTO[];
  auctionByPlate: Record<string, FeaturedNumberAuctionLink>;
}

/**
 * "الأرقام المميزة" — a numbers-focused presentation of the same Plate
 * data every other home section already reads (§ Featured Numbers: no
 * separate rarity entity exists, confirmed during planning). Two tabs,
 * أرقام VIP / أرقام متاحة, are disjoint by construction — they're fed by
 * getVipPlates and the same non-VIP marketplace filter getLatestPlates
 * uses, so a plate can never appear in both.
 *
 * A server-fetched snapshot only, like every other home section — no
 * socket subscription per card (opening one per card here would not scale
 * the way the single subscription on an auction's own detail page does).
 */
export function FeaturedNumbers({ vipPlates, normalPlates, auctionByPlate }: Props) {
  const { t, locale } = useTranslations();
  const [tab, setTab] = useState<"vip" | "normal">(vipPlates.length > 0 ? "vip" : "normal");

  const plates = tab === "vip" ? vipPlates : normalPlates;

  if (vipPlates.length === 0 && normalPlates.length === 0) return null;

  return (
    <section aria-labelledby="featured-numbers-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-stretch gap-3">
          <span className="w-[3px] shrink-0 rounded-(--radius-pill) bg-(--color-gold)" aria-hidden="true" />
          <div>
            <h2 id="featured-numbers-title" className="flex items-center gap-2 text-xl font-bold tracking-tight text-(--color-text) sm:text-2xl">
              <Hash className="h-5 w-5 text-(--color-gold)" aria-hidden="true" strokeWidth={2} />
              {t("home.featuredNumbersTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-(--color-text-muted)">{t("home.featuredNumbersSubtitle")}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 inline-flex rounded-(--radius-pill) border border-(--color-border) bg-(--color-bg-elevated) p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "vip"}
          onClick={() => setTab("vip")}
          className={cn(
            "rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-colors",
            tab === "vip" ? "bg-(--color-gold) text-(--color-gold-foreground)" : "text-(--color-text-muted) hover:text-(--color-text)"
          )}
        >
          {t("home.featuredNumbersVipTab")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "normal"}
          onClick={() => setTab("normal")}
          className={cn(
            "rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-colors",
            tab === "normal" ? "bg-(--color-gold) text-(--color-gold-foreground)" : "text-(--color-text-muted) hover:text-(--color-text)"
          )}
        >
          {t("home.featuredNumbersNormalTab")}
        </button>
      </div>

      {plates.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-text-faint)">{t("home.featuredNumbersEmpty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {plates.map((plate) => {
            const auction = auctionByPlate[plate._id];
            const href = auction ? `/auctions/${auction.auctionId}` : `/listings/${plate._id}`;

            return (
              <Link
                key={plate._id}
                href={href}
                className="mz-hover-lift flex flex-col rounded-(--radius-md) border border-(--color-border-light) bg-(--color-surface)/70 px-3.5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
              >
                <div className="flex items-center justify-between gap-2">
                  {plate.isVip && (
                    <span className="inline-flex items-center gap-1 rounded-(--radius-pill) bg-(--color-gold-tint) px-2 py-0.5 text-[11px] font-bold text-(--color-gold-dark)">
                      <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.4} />
                      VIP
                    </span>
                  )}
                  {auction && <AuctionStatusBadge status={auction.status} className="ms-auto" />}
                </div>

                <div className="mt-1 flex min-h-[4.75rem] items-center justify-center sm:min-h-[5.25rem]">
                  <div className="flex w-[88%] items-center justify-center">
                    <SaudiPlate
                      type={plate.type}
                      usageType={plate.usageType}
                      shape={plate.shape}
                      classification={plate.classification}
                      lettersAr={plate.lettersAr}
                      lettersEn={plate.lettersEn}
                      numbers={plate.numbers}
                      logo={plate.logo}
                      size="xl"
                      vip={plate.isVip}
                      locale={locale}
                    />
                  </div>
                </div>

                {plate.classification && (
                  <div className="mt-2 flex justify-center">
                    <span className="rounded-(--radius-pill) bg-(--color-surface-secondary) px-2.5 py-[3px] text-[12px] leading-none text-(--color-text-secondary)">
                      {plateClassificationLabel(plate.classification, locale)}
                    </span>
                  </div>
                )}

                {auction ? (
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <p className="tnum text-center text-[18px] font-bold leading-none text-(--color-gold)">
                      {formatSar(auction.currentPrice, locale)}
                    </p>
                    <p className="text-[12px] text-(--color-text-faint)">
                      {t("auction.bidsLabel")}: <span className="tnum">{auction.bidCount}</span>
                    </p>
                    {auction.status === "live" && <CountdownTimer endAt={auction.endAt} variant="inline" size="sm" />}
                  </div>
                ) : (
                  <p className="tnum mt-2 text-center text-[18px] font-bold leading-none text-(--color-brand)">
                    {plate.price != null ? formatSar(plate.price, locale) : "—"}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
