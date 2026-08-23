import { notFound } from "next/navigation";
import { getServerLocale } from "@/lib/i18n-server";
import { getManagedPageBySlug } from "@/lib/siteSettingsQueries";
import { localizedText } from "@/lib/siteSettings";

export const revalidate = 0;

export default async function ManagedSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const page = await getManagedPageBySlug(slug);
  if (!page) notFound();

  return (
    <section className="mz-container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-(--color-text) sm:text-4xl">
          {localizedText(locale, page.titleAr, page.titleEn)}
        </h1>
        <div className="mt-6 whitespace-pre-wrap rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-6 text-sm leading-8 text-(--color-text-muted) sm:text-base">
          {localizedText(locale, page.contentAr, page.contentEn)}
        </div>
      </div>
    </section>
  );
}
