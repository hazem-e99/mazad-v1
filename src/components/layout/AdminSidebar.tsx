"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  History,
  Gavel,
  PlusCircle,
  TrendingUp,
  IdCard,
  Crown,
  Users,
  Megaphone,
  Image as ImageIcon,
  ClipboardCheck,
  FolderTree,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { MazadLogo } from "@/components/layout/MazadLogo";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export function useAdminNavGroups(): AdminNavGroup[] {
  const { t } = useTranslations();

  return [
    {
      title: t("admin.navOverview"),
      items: [
        { href: "/admin", label: t("admin.navOverview"), icon: LayoutDashboard },
        { href: "/admin/stats", label: t("admin.navStats"), icon: BarChart3 },
        { href: "/admin/audit", label: t("admin.navAudit"), icon: History },
      ],
    },
    {
      title: t("admin.navAuctionsGroup"),
      items: [
        { href: "/admin/auctions", label: t("admin.navAuctionsList"), icon: Gavel },
        { href: "/admin/auctions/new", label: t("admin.navAuctionCreate"), icon: PlusCircle },
        { href: "/admin/bids", label: t("admin.navBids"), icon: TrendingUp },
      ],
    },
    {
      title: t("admin.navPlatesGroup"),
      items: [
        { href: "/admin/listings", label: t("admin.navListingsModeration"), icon: ClipboardCheck },
        { href: "/admin/plates", label: t("admin.navPlatesList"), icon: IdCard },
        { href: "/admin/vip", label: t("admin.navVip"), icon: Crown },
        { href: "/admin/plate-logos", label: t("admin.navPlateLogos"), icon: ImageIcon },
        { href: "/admin/plate-categories", label: t("admin.navPlateCategories"), icon: FolderTree },
      ],
    },
    {
      title: t("admin.navManagementGroup"),
      items: [
        { href: "/admin/users", label: t("admin.navUsers"), icon: Users },
        { href: "/admin/ads", label: t("admin.navAds"), icon: Megaphone },
      ],
    },
  ];
}

export function AdminNavList({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const groups = useAdminNavGroups();

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-faint)">
            {group.title}
          </h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-(--radius-md) border px-2.5 py-2.5 text-sm font-medium transition-all duration-(--duration-fast)",
                    active
                      ? "border-(--color-gold)/25 bg-(--color-gold-tint) text-(--color-gold)"
                      : "border-transparent text-(--color-text-muted) hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text)"
                  )}
                >
                  {active && <span className="absolute inset-y-1 start-1 w-0.5 rounded-full bg-(--color-gold)" aria-hidden="true" />}
                  <Icon className="relative z-10 h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar() {
  const { t } = useTranslations();

  return (
    <aside
      className="hidden w-[248px] shrink-0 overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 lg:block"
      aria-label={t("admin.navLabel")}
    >
      <div className="mb-5 flex items-center gap-3 border-b border-(--color-border) p-3 pb-5">
        <MazadLogo className="h-10 w-[3.6rem]" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-(--color-text)">{t("admin.navLabel")}</div>
          <div className="text-[11px] text-(--color-text-faint)">مركز التحكم</div>
        </div>
      </div>
      <AdminNavList />
    </aside>
  );
}
