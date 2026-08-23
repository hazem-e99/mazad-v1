import { Eye } from "lucide-react";
import { getSiteSettings } from "@/lib/siteSettingsQueries";
import { getSession, hasPermission } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const revalidate = 0;

/**
 * Site settings.
 *
 * Two entitlements govern this screen and they are deliberately
 * different: `site_settings:view` gets you in (enforced by the layout
 * beside this file), `site_settings:manage` lets you write. A viewer
 * without the second sees every current value but no controls — and the
 * PATCH route re-checks `site_settings:manage` regardless, so the
 * read-only rendering is a courtesy, not the control.
 */
export default async function AdminSiteSettingsPage() {
  const [settings, session, { t }] = await Promise.all([
    getSiteSettings(),
    getSession(),
    getServerTranslator(),
  ]);

  const canEdit = hasPermission(session, "site_settings:manage");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">{t("siteSettings.title")}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">{t("siteSettings.subtitle")}</p>
        </div>

        {!canEdit && (
          <span className="inline-flex items-center gap-2 rounded-(--radius-pill) border border-(--color-border-strong) px-3 py-1.5 text-xs font-semibold text-(--color-text-muted)">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2} />
            {t("siteSettings.viewOnly")}
          </span>
        )}
      </div>

      <SiteSettingsForm initial={settings} canEdit={canEdit} />
    </div>
  );
}
