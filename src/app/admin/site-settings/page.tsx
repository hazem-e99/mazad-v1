import { getSiteSettings } from "@/lib/siteSettingsQueries";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const revalidate = 0;

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">Site Settings</h1>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          تحكم في صور الهيرو، لوجوهات الموقع، الناف بار، الفوتر، الصفحات، وروابط السوشيال.
        </p>
      </div>

      <SiteSettingsForm initial={settings} />
    </div>
  );
}
