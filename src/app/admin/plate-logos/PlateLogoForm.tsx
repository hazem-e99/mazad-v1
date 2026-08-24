"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { validateUploadFile } from "@/lib/fileValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { USAGE_TYPES, usageTypeLabel, PLATE_SHAPES, plateShapeLabel } from "@/lib/constants";
import type { UsageType, PlateShape } from "@/lib/constants";
import type { PlateLogoDTO } from "@/types/dto";

interface PlateLogoFormProps {
  mode: "create" | "edit";
  initial?: PlateLogoDTO;
}

export function PlateLogoForm({ mode, initial }: PlateLogoFormProps) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [allowedUsageTypes, setAllowedUsageTypes] = useState<UsageType[]>(initial?.allowedUsageTypes ?? []);
  const [allowedShapes, setAllowedShapes] = useState<PlateShape[]>(initial?.allowedShapes ?? []);
  const [file, setFile] = useState<File | null>(null);
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

  const displayImage = previewUrl ?? initial?.image ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedSortOrder = sortOrder.trim() === "" ? 0 : Number(sortOrder);
    const existingImage = mode === "edit" ? initial?.image : undefined;
    const data = validate(schemas.plateLogoCreateSchema, {
      nameAr,
      nameEn,
      isActive,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : NaN,
      allowedUsageTypes,
      allowedShapes,
      // On edit the already-stored image satisfies the requirement; on
      // create only a freshly picked file does.
      image: file ? "pending-upload" : existingImage ?? "",
    });
    if (!data) return;

    const fileProblem = validateUploadFile(file, t, "image");
    if (fileProblem) {
      setFieldError("image", fileProblem);
      push(fileProblem, "error");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = initial?.image;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subdir", "plate-logos");
        const uploadData = await apiFetch<{ url: string }>("/api/uploads", {
          method: "POST",
          body: formData,
          silentErrors: true,
        });
        imageUrl = uploadData.url;
      }

      const payload = { ...data, image: imageUrl };

      if (mode === "create") {
        await apiFetch("/api/plate-logos", { method: "POST", body: JSON.stringify(payload), silentErrors: true });
        push(t("admin.logoCreated"), "success");
      } else {
        await apiFetch(`/api/plate-logos/${initial!._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
          silentErrors: true,
        });
        push(t("admin.logoUpdated"), "success");
      }
      router.push("/admin/plate-logos");
      router.refresh();
    } catch (err) {
      applyApiError(err, mode === "create" ? t("admin.logoCreateFailed") : t("admin.logoUpdateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-[820px] border-(--color-border) bg-(--color-surface) shadow-(--shadow-card)">
      <CardBody className="flex flex-col gap-5 p-5 sm:p-6 lg:p-7">
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-(--color-text)">
              {t("admin.logoImageLabel")}
              <span className="text-(--color-gold) ms-0.5" aria-hidden="true">*</span>
            </span>
            <label
              htmlFor="plate-logo-image-input"
              className="relative flex flex-col items-center justify-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) overflow-hidden cursor-pointer hover:border-(--color-gold)/50 transition-colors h-40 w-40"
            >
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt="" className="absolute inset-0 h-full w-full object-contain bg-white p-4" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.5} />
                  <span className="text-xs text-(--color-text-faint)">{mode === "edit" ? t("admin.replaceImageAction") : t("admin.uploadImageAction")}</span>
                </>
              )}
              <input
                id="plate-logo-image-input"
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

          <Input
            label={t("admin.colNameAr")}
            value={nameAr}
            onChange={(e) => {
              setNameAr(e.target.value);
              clearField("nameAr");
            }}
            required
            dir="rtl"
            maxLength={100}
            {...fieldProps("nameAr")}
          />
          <Input
            label={t("admin.colNameEn")}
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value);
              clearField("nameEn");
            }}
            required
            dir="ltr"
            maxLength={100}
            {...fieldProps("nameEn")}
          />
          <Input
            label={t("admin.logoSortOrderLabel")}
            type="number"
            inputMode="numeric"
            step={1}
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              clearField("sortOrder");
            }}
            {...fieldProps("sortOrder")}
          />

          <Checkbox
            label={t("admin.logoActiveLabel")}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(--color-text)">{t("admin.logoAllowedUsageTypesLabel")}</span>
            <p className="text-xs text-(--color-text-faint)">{t("admin.logoAllowedUsageTypesHint")}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {USAGE_TYPES.map((item) => (
                <Checkbox
                  key={item}
                  label={usageTypeLabel(item, locale)}
                  checked={allowedUsageTypes.includes(item)}
                  onChange={(e) =>
                    setAllowedUsageTypes((prev) =>
                      e.target.checked ? [...prev, item] : prev.filter((v) => v !== item)
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(--color-text)">{t("admin.logoAllowedShapesLabel")}</span>
            <p className="text-xs text-(--color-text-faint)">{t("admin.logoAllowedShapesHint")}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PLATE_SHAPES.map((item) => (
                <Checkbox
                  key={item}
                  label={plateShapeLabel(item, locale)}
                  checked={allowedShapes.includes(item)}
                  onChange={(e) =>
                    setAllowedShapes((prev) => (e.target.checked ? [...prev, item] : prev.filter((v) => v !== item)))
                  }
                />
              ))}
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-sm font-medium text-(--color-danger)">
              {formError}
            </p>
          )}

          <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
            {t("admin.saveLogoButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
