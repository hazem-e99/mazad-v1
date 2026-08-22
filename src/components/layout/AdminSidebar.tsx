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
    <div className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-(--color-text-faint) mb-2">
            {group.title}
          </h3>
          <div className="flex flex-col gap-0.5">
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
                    "flex items-center gap-2.5 rounded-(--radius-sm) px-2.5 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                    active
                      ? "bg-(--color-gold)/12 text-(--color-gold)"
                      : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  {item.label}
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
    <nav
      className="w-64 shrink-0 border-e border-(--color-border) bg-(--color-bg-elevated) p-4 hidden lg:block"
      aria-label={t("admin.navLabel")}
    >
      <AdminNavList />
    </nav>
  );
}
