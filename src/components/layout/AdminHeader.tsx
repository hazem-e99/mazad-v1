"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, ExternalLink, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useToastStore } from "@/hooks/useToast";
import { apiFetch } from "@/lib/api-client";
import { AdminNavList } from "@/components/layout/AdminSidebar";
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
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-bg-elevated)">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-(--radius-md) text-(--color-text) hover:bg-(--color-surface)"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-nav"
            aria-label={drawerOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-(--radius-md) bg-(--color-gold) text-(--color-gold-foreground) font-bold text-lg">
              م
            </span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold text-(--color-text)">{t("admin.navLabel")}</span>
              <span className="text-[11px] text-(--color-text-faint)">مزاد</span>
            </span>
          </Link>

          <Badge tone={roleTone[role]} className="hidden sm:inline-flex">
            {roleLabel[role]}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface)" />
          <Link
            href="/"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface)"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("admin.viewSite")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) px-3 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-danger)/10 hover:text-(--color-danger)"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("admin.logoutAction")}</span>
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div
          id="admin-mobile-nav"
          className="lg:hidden border-t border-(--color-border) bg-(--color-bg-elevated) px-3 py-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
          aria-label={t("admin.navMobileLabel")}
        >
          <AdminNavList onNavigate={() => setDrawerOpen(false)} />
          <div className="mt-4 flex items-center gap-2 border-t border-(--color-border) pt-4">
            <LanguageSwitcher className="flex-1 justify-center h-9 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-text)" />
            <Link
              href="/"
              className="flex-1 inline-flex justify-center h-9 items-center gap-1.5 rounded-(--radius-md) border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-text)"
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
