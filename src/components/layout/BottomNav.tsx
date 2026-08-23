"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Gavel, Home, Plus, UserRound, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { isNavItemActive } from "@/lib/navItems";
import { cn } from "@/lib/cn";

/**
 * The phone-only tab bar, with the add-plate action raised into the
 * middle.
 *
 * Every destination is a real route that already exists — the bar is a
 * second way to reach them, never a new surface. "حسابي" points at
 * /account, which redirects to sign-in when there is no session, so the
 * bar does not have to know who is viewing.
 *
 * Hidden from `lg` up, where the hero's own menu and the sticky header
 * cover the same ground.
 */
const TABS: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/vip", labelKey: "nav.featured", icon: Crown },
  { href: "/auctions", labelKey: "nav.auctions", icon: Gavel },
  { href: "/account", labelKey: "nav.myAccount", icon: UserRound },
];

export function BottomNav() {
  const { t } = useTranslations();
  const pathname = usePathname();

  return (
    <>
      {/* Reserves the bar's height so the last section of any page can be
          scrolled clear of it rather than sitting underneath. */}
      <div className="h-[4.75rem] lg:hidden" aria-hidden="true" />

      <nav
        aria-label={t("nav.bottomNav")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto flex h-[4.75rem] max-w-lg items-center justify-around px-2">
          {TABS.slice(0, 2).map((tab) => (
            <Tab key={tab.href} tab={tab} pathname={pathname} t={t} />
          ))}

          <li className="flex-1">
            <Link
              href="/plates/new"
              className="mx-auto flex w-16 flex-col items-center gap-1 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "flex h-13 w-13 -translate-y-4 items-center justify-center rounded-full bg-(--color-brand) text-(--color-brand-foreground)",
                  "shadow-[0_10px_24px_-8px_rgba(8,116,69,0.65)] ring-4 ring-(--color-bg) transition-transform duration-(--duration-fast) active:scale-95"
                )}
              >
                <Plus className="h-6 w-6" aria-hidden="true" strokeWidth={2.6} />
              </span>
              <span className="-mt-3 text-[10px] font-semibold text-(--color-text-muted)">{t("nav.addPlate")}</span>
            </Link>
          </li>

          {TABS.slice(2).map((tab) => (
            <Tab key={tab.href} tab={tab} pathname={pathname} t={t} />
          ))}
        </ul>
      </nav>
    </>
  );
}

function Tab({
  tab,
  pathname,
  t,
}: {
  tab: { href: string; labelKey: string; icon: LucideIcon };
  pathname: string;
  t: (key: string) => string;
}) {
  const active = isNavItemActive(tab.href, pathname);

  return (
    <li className="flex-1">
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 rounded-(--radius-md) py-2 text-[10px] font-semibold transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
          active ? "text-(--color-brand)" : "text-(--color-text-muted) hover:text-(--color-text)"
        )}
      >
        <tab.icon className="h-[22px] w-[22px]" aria-hidden="true" strokeWidth={active ? 2.3 : 1.8} />
        {t(tab.labelKey)}
      </Link>
    </li>
  );
}
