"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const { t, locale } = useTranslations();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-2xl font-bold text-(--color-text) tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-(--color-text-muted) mt-1">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 flex items-center gap-1 text-sm font-semibold text-(--color-gold) hover:text-(--color-gold-hover) transition-colors"
        >
          {t("home.viewAll")}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
