import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { getServerTranslator } from "@/lib/i18n-server";
import { toPlateLogoDTO, type LeanPlateLogo } from "@/lib/dto";
import { PlateLogoForm } from "../../PlateLogoForm";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPlateLogoPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const [logoDoc, { t }] = await Promise.all([PlateLogo.findById(id).lean<LeanPlateLogo>(), getServerTranslator()]);
  if (!logoDoc) notFound();

  const logo = toPlateLogoDTO(logoDoc);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.editLogoTitle")}</h1>
      <PlateLogoForm mode="edit" initial={logo} />
    </div>
  );
}
