import { getServerTranslator } from "@/lib/i18n-server";
import { PlateCategoryForm } from "../PlateCategoryForm";

export default async function NewPlateCategoryPage() {
  const { t } = await getServerTranslator();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.newCategoryTitle")}</h1>
      <PlateCategoryForm mode="create" />
    </div>
  );
}
