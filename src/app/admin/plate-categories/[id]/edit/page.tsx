import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { PlateCategory } from "@/models/PlateCategory";
import { getServerTranslator } from "@/lib/i18n-server";
import { toPlateCategoryDTO, type LeanPlateCategory } from "@/lib/dto";
import { PlateCategoryForm } from "../../PlateCategoryForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlateCategoryPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const { t } = await getServerTranslator();

  const doc = await PlateCategory.findById(id).lean<LeanPlateCategory>();
  if (!doc) notFound();
  const category = toPlateCategoryDTO(doc);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.editCategoryTitle")}</h1>
      <PlateCategoryForm mode="edit" initial={category} />
    </div>
  );
}
