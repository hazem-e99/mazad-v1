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
  Store,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TopSocialBar } from "@/components/home/TopSocialBar";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { accountNavItems, isNavItemActive, mainNavItems, type HeaderViewer } from "@/lib/navItems";

// Re-exported so existing importers keep working; the definition itself
// lives with the nav data it describes.
export type { HeaderViewer };

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
    const reset = window.setTimeout(() => {
      setMenuOpen(false);
      setAccountOpen(false);
    }, 0);

    return () => window.clearTimeout(reset);
  }, [pathname]);

  // Shared with the hero drawer and the bottom bar, so the three can
  // never offer different destinations.
  const navItems = mainNavItems(viewer).map((item) => ({ ...item, label: t(item.labelKey) }));
  const accountItems = accountNavItems(viewer).map((item) => ({ ...item, label: t(item.labelKey) }));

  const isActive = (href: string) => isNavItemActive(href, pathname);

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

  // The home page is its own header: the hero carries the menu button and
  // the sign-in pill over the artwork (see HeroChrome), so a second bar
  // stacked above it would push the stage down and duplicate the nav.
  // What survives here is the charcoal social strip that sits above it.
  if (pathname === "/") return <TopSocialBar />;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-(--duration-base)",
        scrolled
          ? "border-b border-(--color-border) bg-(--color-bg)/90 shadow-[0_12px_30px_-24px_rgba(0,0,0,.9)] backdrop-blur-xl"
          : "border-b border-transparent bg-(--color-bg)"
      )}
    >
      <div className="mz-container flex h-20 items-center justify-between gap-5">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
        >
          <MazadLogo className="h-10 w-10 transition-transform duration-(--duration-base) group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-(--color-text)">مزاد</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label={t("nav.mainNav")}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-(--radius-sm) px-3 py-2.5 text-sm font-medium transition-colors duration-(--duration-fast)",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                  active
                    ? "text-(--color-gold) after:absolute after:inset-x-3 after:-bottom-2 after:h-px after:bg-(--color-gold)"
                    : "text-(--color-text-muted) hover:text-(--color-text)"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ThemeToggle />
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
                    className="absolute end-0 top-full z-20 mt-3 w-56 overflow-hidden rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) p-1.5 shadow-(--shadow-elevated)"
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
          <div className="flex items-center justify-center gap-2 pb-1">
            <ThemeToggle />
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
