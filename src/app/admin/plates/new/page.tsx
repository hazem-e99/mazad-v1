"use client";

import { useState } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { PLATE_TYPES, plateTypeLabel } from "@/lib/constants";
import type { PlateType } from "@/lib/constants";

export default function AdminNewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError } = usePlateLogos();
  const [type, setType] = useState<PlateType>("private");
  const [lettersAr, setLettersAr] = useState("");
  const [lettersEn, setLettersEn] = useState("");
  const [numbers, setNumbers] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [logoId, setLogoId] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subdir", "plates");
        const uploadData = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: formData });
        imageUrl = uploadData.url;
      }
      await apiFetch("/api/plates", {
        method: "POST",
        body: JSON.stringify({ type, lettersAr, lettersEn, numbers, image: imageUrl, logo: logoId, isVip, isFeatured }),
      });
      push(t("admin.plateCreated"), "success");
      router.push("/admin/plates");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("admin.plateCreateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <h1 className="mb-6 text-2xl font-bold text-(--color-text)">{t("admin.newPlateTitle")}</h1>
      <Card className="border-(--color-border) bg-(--color-surface) shadow-(--shadow-card)">
        <CardBody className="flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(--color-text)">صورة اللوحة</span>
            <label
              htmlFor="plate-image-input"
              className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) transition-colors hover:border-(--color-gold)/50"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="معاينة صورة اللوحة" className="absolute inset-0 h-full w-full object-contain bg-white p-3" />
              ) : (
                <>
                  <ImagePlus className="h-7 w-7 text-(--color-gold)" aria-hidden="true" />
                  <span className="text-sm text-(--color-text-muted)">اضغط لاختيار صورة اللوحة</span>
                  <span className="text-xs text-(--color-text-faint)">PNG أو JPG أو WebP</span>
                </>
              )}
              <input
                id="plate-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.plateTypeLabel")}</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PlateType)}
                  className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm"
                >
                  {PLATE_TYPES.map((plateType) => (
                    <option key={plateType} value={plateType}>
                      {plateTypeLabel(plateType, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <PlateLogoSelect
                label={t("pages.plateLogoLabel")}
                value={logoId}
                onChange={setLogoId}
                logos={logos}
                loadError={loadError}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label={t("pages.lettersArLabel")} value={lettersAr} onChange={(e) => setLettersAr(e.target.value)} required />
              <Input label={t("pages.lettersEnLabel")} value={lettersEn} onChange={(e) => setLettersEn(e.target.value)} required />
              <Input
                label={t("pages.numbersLabel")}
                value={numbers}
                onChange={(e) => setNumbers(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={4}
                required
                error={error ?? undefined}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-(--color-text)">
                <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
                {t("admin.plateVipCheckbox")}
              </label>
              <label className="flex items-center gap-2 text-sm text-(--color-text)">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                {t("admin.plateFeaturedCheckbox")}
              </label>
            </div>

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("admin.createPlateButton")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
