"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { validateUploadFile } from "@/lib/fileValidation";
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
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, errorFor, fieldProps, formError, validate, applyApiError, setFieldError, clearField } =
    useFormValidation(formRef);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = validate(schemas.plateSchema, {
      type,
      lettersAr,
      lettersEn,
      numbers,
      logo: logoId,
      isVip,
      isFeatured,
    });
    if (!data) return;

    // The image is optional here, but if one was chosen it must be usable.
    const fileProblem = validateUploadFile(file, t, "image");
    if (fileProblem) {
      setFieldError("image", fileProblem);
      push(fileProblem, "error");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subdir", "plates");
        const uploadData = await apiFetch<{ url: string }>("/api/uploads", {
          method: "POST",
          body: formData,
          silentErrors: true,
        });
        imageUrl = uploadData.url;
      }
      await apiFetch("/api/plates", {
        method: "POST",
        body: JSON.stringify({ ...data, image: imageUrl }),
        silentErrors: true,
      });
      push(t("admin.plateCreated"), "success");
      router.push("/admin/plates");
      router.refresh();
    } catch (err) {
      applyApiError(err, t("admin.plateCreateFailed"));
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
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  const problem = validateUploadFile(picked, t, "image");
                  if (problem) {
                    e.target.value = "";
                    setFile(null);
                    setFieldError("image", problem);
                    push(problem, "error");
                    return;
                  }
                  setFile(picked);
                  clearField("image");
                }}
                className="sr-only"
              />
            </label>
            {errorFor("image") && (
              <p role="alert" className="text-xs font-medium text-(--color-danger)">
                {errorFor("image")}
              </p>
            )}
          </div>

          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t("pages.plateTypeLabel")}
                value={type}
                onChange={(e) => setType(e.target.value as PlateType)}
                {...fieldProps("type")}
              >
                {PLATE_TYPES.map((plateType) => (
                  <option key={plateType} value={plateType}>
                    {plateTypeLabel(plateType, locale)}
                  </option>
                ))}
              </Select>
              <PlateLogoSelect
                label={t("pages.plateLogoLabel")}
                value={logoId}
                onChange={setLogoId}
                logos={logos}
                loadError={loadError}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t("pages.lettersArLabel")}
                value={lettersAr}
                onChange={(e) => {
                  setLettersAr(e.target.value);
                  clearField("lettersAr");
                }}
                required
                dir="rtl"
                maxLength={10}
                {...fieldProps("lettersAr")}
              />
              <Input
                label={t("pages.lettersEnLabel")}
                value={lettersEn}
                onChange={(e) => {
                  setLettersEn(e.target.value.toUpperCase());
                  clearField("lettersEn");
                }}
                required
                dir="ltr"
                maxLength={10}
                {...fieldProps("lettersEn")}
              />
              <Input
                label={t("pages.numbersLabel")}
                value={numbers}
                onChange={(e) => {
                  setNumbers(e.target.value.replace(/[^0-9]/g, ""));
                  clearField("numbers");
                }}
                inputMode="numeric"
                dir="ltr"
                maxLength={4}
                required
                {...fieldProps("numbers")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Checkbox
                label={t("admin.plateVipCheckbox")}
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
              />
              <Checkbox
                label={t("admin.plateFeaturedCheckbox")}
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
            </div>

            {formError && (
              <p role="alert" className="text-sm font-medium text-(--color-danger)">
                {formError}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("admin.createPlateButton")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
