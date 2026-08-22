import { getServerTranslator } from "@/lib/i18n-server";
import { PlateLogoForm } from "../PlateLogoForm";

export default async function AdminNewPlateLogoPage() {
  const { t } = await getServerTranslator();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.newLogoTitle")}</h1>
      <PlateLogoForm mode="create" />
    </div>
  );
}
