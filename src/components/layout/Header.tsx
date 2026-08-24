"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Menu, UserRound, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SocialIcon } from "@/components/layout/SocialGlyphs";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { accountNavItems, isNavItemActive, mainNavItems, navLabel, type HeaderViewer } from "@/lib/navItems";
import type { SiteSettingsDTO } from "@/lib/siteSettings";

// Re-exported so existing importers keep working; the definition itself
// lives with the nav data it describes.
export type { HeaderViewer };

export function Header({ viewer, settings }: { viewer: HeaderViewer | null; settings: SiteSettingsDTO }) {
  const pathname = usePathname();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, locale } = useTranslations();

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
  const navItems = mainNavItems(viewer, settings.navItems).map((item) => ({ ...item, label: navLabel(t, item, locale) }));
  const accountItems = accountNavItems(viewer).map((item) => ({ ...item, label: navLabel(t, item, locale) }));

  const isActive = (href: string) => isNavItemActive(href, pathname);

  // Only the home page puts a dark hero image behind the navbar (every
  // other route renders the h-20 spacer below instead), so only there may
  // the bar go transparent and switch to white type. Keying that off
  // `!scrolled` alone painted white links onto the light page background
  // of /auctions, /listings and the rest — legible on the hero, invisible
  // everywhere else.
  const overHero = pathname === "/" && !scrolled;
  const transparentTextShadow = overHero ? { textShadow: "0 1px 12px rgba(0,0,0,.45)" } : undefined;

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

  const socialLinks = settings.footer.socials.filter((social) => social.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-(--duration-base)",
          overHero
            ? "border-transparent bg-transparent"
            : "border-(--color-border) bg-(--color-bg)/90 shadow-[0_12px_30px_-24px_rgba(0,0,0,.9)] backdrop-blur-xl"
        )}
      >
        <div className="mz-container flex h-20 items-center justify-between gap-5">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
        >
          {/* No text label beside it: the mark already carries the
              wordmark, so a word next to it would set the name twice. */}
          <MazadLogo src={settings.brand.headerLogoUrl || settings.brand.logoUrl} className="h-10 w-[3.6rem] transition-transform duration-(--duration-base) group-hover:scale-105" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label={t("nav.mainNav")}>
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
                    : overHero
                      ? "text-white/88 hover:text-white"
                      : "text-(--color-text-muted) hover:text-(--color-text)"
                )}
                style={transparentTextShadow}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {socialLinks.length > 0 && (
            <ul className="hidden items-center gap-1 xl:flex" aria-label={t("home.followUs")}>
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-(--radius-sm) transition-colors duration-(--duration-fast)",
                      overHero
                        ? "text-white/82 hover:bg-white/12 hover:text-white"
                        : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-gold)"
                    )}
                    style={transparentTextShadow}
                  >
                    <SocialIcon platform={social.platform} className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className={cn(overHero && "[&_button]:border-white/55 [&_button]:bg-black/18 [&_button]:text-white [&_button:hover]:bg-black/28")}>
            <ThemeToggle />
          </div>
          <div className={cn(overHero && "[&_button]:border-white/55 [&_button]:bg-black/18 [&_button]:text-white [&_button:hover]:bg-black/28")}>
            <LanguageSwitcher />
          </div>
          {viewer && <NotificationBell overHero={overHero} />}
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
                className={cn(overHero && "border-white/55 bg-black/18 text-white hover:bg-black/28")}
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
          {viewer && <NotificationBell overHero={overHero} />}
          <LinkButton href={viewer ? "/account" : "/login"} variant="gold" size="sm" className="hidden sm:inline-flex">
            {viewer ? t("nav.myAccount") : t("nav.login")}
          </LinkButton>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-(--radius-md) border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
              overHero
                ? "border-white/55 bg-black/18 text-white hover:bg-black/28"
                : "border-(--color-border-strong) text-(--color-text) hover:bg-(--color-surface)"
            )}
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
      {pathname !== "/" && <div className="h-20 shrink-0" aria-hidden="true" />}
    </>
  );
}
