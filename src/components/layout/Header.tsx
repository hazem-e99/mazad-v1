"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gavel, Crown, Sparkles, Megaphone, MessageCircle, Plus, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { LinkButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useTranslations();

  const navItems = [
    { href: "/auctions", label: t("nav.auctions"), icon: Gavel },
    { href: "/auctions/exclusive", label: t("nav.exclusive"), icon: Sparkles },
    { href: "/vip", label: t("nav.vip"), icon: Crown },
    { href: "/ads", label: t("nav.ads"), icon: Megaphone },
    { href: "/chat", label: t("nav.chat"), icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-bg)/95 backdrop-blur supports-backdrop-blur:bg-(--color-bg)/80">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-(--radius-md) bg-(--color-gold) text-(--color-gold-foreground) font-bold text-xl transition-transform duration-(--duration-base) group-hover:scale-105">
            م
          </span>
          <span className="text-xl font-bold text-(--color-text) tracking-tight">مزاد</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label={t("nav.mainNav")}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-(--radius-sm) px-3 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                  active
                    ? "text-(--color-gold)"
                    : "text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface)"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-(--color-gold)" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <LinkButton href="/plates/new" variant="ghost" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addPlate")}
          </LinkButton>
          <LinkButton href="/ads/new" variant="secondary" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addAd")}
          </LinkButton>
          <LinkButton href="/login" variant="gold" size="sm">
            {t("nav.login")}
          </LinkButton>
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-(--radius-md) text-(--color-text) hover:bg-(--color-surface)"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5.5 w-5.5" aria-hidden="true" /> : <Menu className="h-5.5 w-5.5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="lg:hidden border-t border-(--color-border) bg-(--color-bg)">
          <nav className="flex flex-col p-3 gap-0.5" aria-label={t("nav.mobileNav")}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-(--radius-sm) px-3 py-3 text-[15px] font-medium",
                    active ? "text-(--color-gold) bg-(--color-surface)" : "text-(--color-text-muted) hover:bg-(--color-surface)"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-(--color-border) pt-3">
              <div className="flex justify-center pb-1">
                <LanguageSwitcher />
              </div>
              <LinkButton
                href="/plates/new"
                variant="secondary"
                size="md"
                className="w-full justify-center"
                onClick={() => setOpen(false)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("nav.addPlate")}
              </LinkButton>
              <LinkButton
                href="/ads/new"
                variant="secondary"
                size="md"
                className="w-full justify-center"
                onClick={() => setOpen(false)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("nav.addAd")}
              </LinkButton>
              <LinkButton
                href="/login"
                variant="gold"
                size="md"
                className="w-full justify-center"
                onClick={() => setOpen(false)}
              >
                {t("nav.login")}
              </LinkButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
