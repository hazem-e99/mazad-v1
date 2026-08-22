"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Gavel,
  Crown,
  Sparkles,
  Megaphone,
  MessageCircle,
  Plus,
  Menu,
  Home,
  IdCard,
  UserRound,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import type { UserRole } from "@/lib/constants";

export interface HeaderViewer {
  role: UserRole;
  isStaff: boolean;
}

export function Header({ viewer }: { viewer: HeaderViewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslations();

  // The navbar only earns its blur and border once content has moved
  // beneath it — at rest it sits flush on the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes both overlays; without this the account menu
  // survives a route change and hangs over the new page.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/auctions", label: t("nav.auctions"), icon: Gavel },
    { href: "/vip", label: t("nav.vip"), icon: Crown },
    { href: "/auctions/exclusive", label: t("nav.exclusive"), icon: Sparkles },
    ...(viewer ? [{ href: "/account/plates", label: t("nav.myPlates"), icon: IdCard }] : []),
    { href: "/ads", label: t("nav.ads"), icon: Megaphone },
    { href: "/chat", label: t("nav.chat"), icon: MessageCircle },
  ];

  const accountItems = [
    { href: "/account", label: t("nav.myAccount"), icon: UserRound },
    { href: "/account/plates", label: t("nav.myPlates"), icon: IdCard },
    { href: "/account/bids", label: t("nav.myBids"), icon: TrendingUp },
    ...(viewer?.isStaff ? [{ href: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard }] : []),
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      push(t("admin.logoutSuccess"), "success");
      router.push("/");
      router.refresh();
    } catch {
      push(t("common.actionFailed"), "error");
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-(--duration-base)",
        scrolled
          ? "border-b border-(--color-border) bg-(--color-bg)/80 shadow-[0_8px_24px_-16px_rgba(0,0,0,.9)] backdrop-blur-xl"
          : "border-b border-transparent bg-(--color-bg)"
      )}
    >
      <div className="mz-container flex h-18 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
        >
          <MazadLogo className="h-10 w-10 transition-transform duration-(--duration-base) group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-(--color-text)">مزاد</span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label={t("nav.mainNav")}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-(--radius-sm) px-3.5 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  active
                    ? "bg-(--color-gold-tint) text-(--color-gold)"
                    : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <LinkButton href="/plates/new" variant="secondary" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addPlate")}
          </LinkButton>

          {viewer ? (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {t("nav.myAccount")}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", accountOpen && "rotate-180")} aria-hidden="true" />
              </Button>

              {accountOpen && (
                <>
                  {/* Click-away layer instead of a document listener: it
                      cannot miss a click that lands inside another
                      stopPropagation'd subtree. */}
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label={t("common.close")}
                    onClick={() => setAccountOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute end-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) p-1.5 shadow-(--shadow-elevated)"
                  >
                    {accountItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-(--radius-sm) px-3 py-2.5 text-sm text-(--color-text-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text)"
                      >
                        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-1.5 h-px bg-(--color-border)" aria-hidden="true" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-(--radius-sm) px-3 py-2.5 text-sm text-(--color-text-muted) transition-colors hover:bg-(--color-danger)/10 hover:text-(--color-danger)"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                      {t("admin.logoutAction")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <LinkButton href="/login" variant="gold" size="sm">
              {t("nav.login")}
            </LinkButton>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LinkButton href={viewer ? "/account" : "/login"} variant="gold" size="sm" className="hidden sm:inline-flex">
            {viewer ? t("nav.myAccount") : t("nav.login")}
          </LinkButton>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-md) border border-(--color-border-strong) text-(--color-text) transition-colors hover:bg-(--color-surface) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            aria-expanded={menuOpen}
            aria-label={t("nav.openMenu")}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={t("nav.mobileNav")}>
        <nav className="flex flex-col gap-1" aria-label={t("nav.mobileNav")}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-(--radius-md) px-3 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "bg-(--color-gold-tint) text-(--color-gold)"
                    : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}

          {viewer && (
            <>
              <div className="my-2 h-px bg-(--color-border)" aria-hidden="true" />
              {accountItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-(--radius-md) px-3 py-3 text-[15px] font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-text)"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="mt-4 flex flex-col gap-2.5 border-t border-(--color-border) pt-4">
          <div className="flex justify-center pb-1">
            <LanguageSwitcher />
          </div>
          <LinkButton href="/plates/new" variant="secondary" size="md" className="w-full" onClick={() => setMenuOpen(false)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addPlate")}
          </LinkButton>
          <LinkButton href="/ads/new" variant="secondary" size="md" className="w-full" onClick={() => setMenuOpen(false)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addAd")}
          </LinkButton>
          {viewer ? (
            <Button variant="ghost" size="md" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("admin.logoutAction")}
            </Button>
          ) : (
            <LinkButton href="/login" variant="gold" size="md" className="w-full" onClick={() => setMenuOpen(false)}>
              {t("nav.login")}
            </LinkButton>
          )}
        </div>
      </Drawer>
    </header>
  );
}
