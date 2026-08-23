"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, Plus, UserRound } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button, LinkButton } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useToastStore } from "@/hooks/useToast";
import { apiFetch } from "@/lib/api-client";
import { accountNavItems, isNavItemActive, mainNavItems, type HeaderViewer } from "@/lib/navItems";
import { cn } from "@/lib/cn";

/**
 * The two controls that float over the hero: a round menu button on the
 * reading side and the gold sign-in pill opposite it.
 *
 * The home page has no sticky navbar — the hero *is* the header — so the
 * full navigation lives in this drawer. It is built from the same
 * `mainNavItems`/`accountNavItems` the sticky header uses, so the two
 * offer identical destinations, and `viewer` comes from the server
 * session: the client never decides on its own whether someone is signed
 * in or is staff.
 */
export function HeroChrome({ viewer }: { viewer: HeaderViewer | null }) {
  const { t } = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [open, setOpen] = useState(false);

  // Any navigation closes the drawer; without this it survives a route
  // change and hangs over the new page.
  useEffect(() => {
    const reset = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(reset);
  }, [pathname]);

  const navItems = mainNavItems(viewer);
  const accountItems = accountNavItems(viewer);

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
    <>
      <div className="mz-container absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 pt-4 sm:pt-6">
        {viewer ? (
          <LinkButton
            href="/account"
            variant="gold"
            size="md"
            className="mz-gold-surface h-11 rounded-(--radius-pill) px-5 text-sm hover:brightness-105"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
            {t("nav.myAccount")}
          </LinkButton>
        ) : (
          <LinkButton
            href="/login"
            variant="gold"
            size="md"
            className="mz-gold-surface h-11 rounded-(--radius-pill) px-5 text-sm hover:brightness-105"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
            {t("auth.loginTitle")}
          </LinkButton>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label={t("nav.openMenu")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-(--color-surface)/92 text-(--color-text) shadow-[0_10px_26px_-14px_rgba(41,38,32,0.7)] backdrop-blur-sm transition-transform duration-(--duration-fast) hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          <Menu className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
        </button>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={t("nav.mobileNav")}>
        <nav className="flex flex-col gap-1" aria-label={t("nav.mobileNav")}>
          {navItems.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-(--radius-md) px-3 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "bg-(--color-gold-tint) text-(--color-gold)"
                    : "text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-text)"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                {t(item.labelKey)}
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
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-(--radius-md) px-3 py-3 text-[15px] font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text)"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                  {t(item.labelKey)}
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
          <LinkButton href="/plates/new" variant="secondary" size="md" className="w-full" onClick={() => setOpen(false)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addPlate")}
          </LinkButton>
          {viewer ? (
            <Button variant="ghost" size="md" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("admin.logoutAction")}
            </Button>
          ) : (
            <LinkButton href="/login" variant="gold" size="md" className="w-full" onClick={() => setOpen(false)}>
              {t("nav.login")}
            </LinkButton>
          )}
        </div>
      </Drawer>
    </>
  );
}
