"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, IdCard, TrendingUp, ShieldCheck } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useTranslations();

  const items = [
    { href: "/account", label: t("account.navProfile"), icon: UserRound },
    { href: "/account/plates", label: t("account.navPlates"), icon: IdCard },
    { href: "/account/bids", label: t("account.navBids"), icon: TrendingUp },
    { href: "/account/security", label: t("account.navSecurity"), icon: ShieldCheck },
  ];

  return (
    <nav
      aria-label={t("account.title")}
      // Below lg this becomes a horizontal, scrollable tab rail rather
      // than a stacked list that would push the content off-screen.
      className="mz-scroller flex gap-1.5 overflow-x-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-2 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-(--radius-md) px-3.5 py-2.5 text-sm font-medium transition-colors duration-(--duration-fast)",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
              active
                ? "bg-(--color-gold-tint) text-(--color-gold)"
                : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
