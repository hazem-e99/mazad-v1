"use client";

import Link from "next/link";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function Footer() {
  const { t } = useTranslations();

  return (
    <footer className="mt-20 border-t border-(--color-border) bg-(--color-bg-elevated)">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-(--radius-md) bg-(--color-gold) text-(--color-gold-foreground) font-bold">
              م
            </span>
            <span className="font-bold text-lg text-(--color-text) tracking-tight">مزاد</span>
          </div>
          <p className="text-sm text-(--color-text-muted) leading-relaxed max-w-xs">{t("footer.tagline")}</p>
        </div>

        <nav aria-label={t("footer.quickLinks")}>
          <h3 className="text-sm font-semibold text-(--color-text) mb-4">{t("footer.quickLinks")}</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-(--color-text-muted)">
            <li><Link href="/auctions" className="transition-colors hover:text-(--color-gold)">{t("nav.auctions")}</Link></li>
            <li><Link href="/vip" className="transition-colors hover:text-(--color-gold)">{t("nav.vip")}</Link></li>
            <li><Link href="/auctions/exclusive" className="transition-colors hover:text-(--color-gold)">{t("nav.exclusive")}</Link></li>
            <li><Link href="/ads" className="transition-colors hover:text-(--color-gold)">{t("nav.ads")}</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold text-(--color-text) mb-4">{t("footer.contact")}</h3>
          <p className="text-sm text-(--color-text-muted) leading-relaxed max-w-xs">{t("footer.contactHint")}</p>
        </div>
      </div>

      <div className="border-t border-(--color-border) py-5">
        <p className="text-center text-xs text-(--color-text-faint)">
          © {new Date().getFullYear()} Mazad. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
