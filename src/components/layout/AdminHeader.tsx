"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, ExternalLink, LogOut, Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useToastStore } from "@/hooks/useToast";
import { apiFetch } from "@/lib/api-client";
import { AdminNavList } from "@/components/layout/AdminSidebar";
import { MazadLogo } from "@/components/layout/MazadLogo";
import type { UserRole } from "@/lib/constants";

const roleTone = { admin: "gold", supervisor: "scheduled", user: "neutral" } as const;

export function AdminHeader({ role }: { role: UserRole }) {
  const { t } = useTranslations();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roleLabel = { admin: t("admin.roleAdmin"), supervisor: t("admin.roleSupervisor"), user: t("common.active") } as const;

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      push(t("admin.logoutSuccess"), "success");
      router.push("/login");
      router.refresh();
    } catch {
      push(t("common.actionFailed"), "error");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-bg)/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold) lg:hidden"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-nav"
            aria-label={drawerOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          <Link href="/admin" className="flex items-center gap-3">
            <MazadLogo className="h-10 w-[3.6rem]" />
            {/* Only the section name here — the mark already carries the
                brand, so the old "Mazad" sub-label would set it twice. */}
            <span className="hidden text-sm font-bold leading-tight text-(--color-text) sm:block">
              {t("admin.navLabel")}
            </span>
          </Link>

          <Badge tone={roleTone[role]} className="hidden sm:inline-flex">
            {roleLabel[role]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold)"
            aria-label={t("admin.navAudit")}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>
          <ThemeToggle className="h-10 w-10 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-gold)/40 hover:text-(--color-gold)" />
          <LanguageSwitcher className="hidden h-10 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text) transition-colors hover:border-(--color-gold)/40 sm:inline-flex" />
          <Link
            href="/"
            className="hidden h-10 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold) sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("admin.viewSite")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text-muted) transition-colors hover:border-(--color-danger)/40 hover:bg-(--color-danger)/8 hover:text-(--color-danger)"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("admin.logoutAction")}</span>
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div
          id="admin-mobile-nav"
          className="border-t border-(--color-border) bg-(--color-bg-elevated) px-3 py-4 lg:hidden"
          aria-label={t("admin.navMobileLabel")}
        >
          <AdminNavList onNavigate={() => setDrawerOpen(false)} />
          <div className="mt-4 flex items-center gap-2 border-t border-(--color-border) pt-4">
            <ThemeToggle className="h-10 w-10 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-gold)/40 hover:text-(--color-gold)" />
            <LanguageSwitcher className="flex-1 justify-center h-10 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text)" />
            <Link
              href="/"
              className="flex-1 inline-flex justify-center h-10 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text)"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("admin.viewSite")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
