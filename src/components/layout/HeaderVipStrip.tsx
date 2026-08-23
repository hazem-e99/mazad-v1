"use client";

import Link from "next/link";
import { Crown, ArrowLeft, ArrowRight } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateDTO } from "@/types/dto";

export function HeaderVipStrip({ plates }: { plates: PlateDTO[] }) {
  const { t, locale } = useTranslations();

  if (plates.length === 0) return null;

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="border-b border-(--color-vip-border) bg-(--color-vip-surface)">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 py-2.5">
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-(--color-gold) tracking-wide">
          <Crown className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
          {t("pages.vipStripLabel")}
        </span>
        <div className="h-4 w-px bg-(--color-vip-border) shrink-0" aria-hidden="true" />
        <div className="flex min-w-0 items-center gap-2.5 overflow-x-auto py-0.5">
          {plates.map((p) => (
            <Link
              key={p._id}
              href="/vip"
              className="shrink-0 rounded-md transition-transform duration-(--duration-fast) hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
              aria-label={t("pages.vipPlateAriaLabel", { letters: p.lettersAr, numbers: p.numbers })}
            >
              <SaudiPlate
                type={p.type}
                lettersAr={p.lettersAr}
                lettersEn={p.lettersEn}
                numbers={p.numbers}
                logo={p.logo}
                size="xs"
                locale={locale}
              />
            </Link>
          ))}
        </div>
        <Link
          href="/vip"
          className="ms-auto shrink-0 flex items-center gap-1 text-xs font-semibold text-(--color-gold) hover:text-(--color-gold-hover)"
        >
          {t("home.viewAll")}
          <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
