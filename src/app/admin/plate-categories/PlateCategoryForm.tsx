"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { validateUploadFile } from "@/lib/fileValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateCategoryDTO } from "@/types/dto";

interface PlateCategoryFormProps {
  mode: "create" | "edit";
  initial?: PlateCategoryDTO;
}

export function PlateCategoryForm({ mode, initial }: PlateCategoryFormProps) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [file, setFile] = useState<File | null>(null);
  // Distinguishes "left the stored image alone" from "asked for it gone".
  // Without this the payload could not tell the two apart, and clearing an
  // image would silently behave like keeping it.
  const [imageCleared, setImageCleared] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, errorFor, fieldProps, formError, validate, applyApiError, setFieldError, clearField } =
    useFormValidation(formRef);

  const storedImage = imageCleared ? null : initial?.image ?? null;

  /** One gate for both the picker and the drop target. */
  function handlePick(picked: File | null) {
    if (!picked) return;
    const problem = validateUploadFile(picked, t, "image");
    if (problem) {
      setFile(null);
      setFieldError("image", problem);
      push(problem, "error");
      return;
    }
    setFile(picked);
    setImageCleared(false);
    clearField("image");
  }

  function handleRemove() {
    setFile(null);
    setImageCleared(true);
    clearField("image");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const parsedSortOrder = sortOrder.trim() === "" ? 0 : Number(sortOrder);
    const data = validate(schemas.plateCategoryCreateSchema, {
      nameAr,
      nameEn,
      isActive,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : NaN,
    });
    if (!data) return;

    // Re-checked at submit, not only at pick time: the server enforces the
    // same rules again, and this spares the user a doomed round trip.
    const fileProblem = validateUploadFile(file, t, "image");
    if (fileProblem) {
      setFieldError("image", fileProblem);
      push(fileProblem, "error");
      return;
    }

    setLoading(true);
    try {
      // The project's established two-step upload: the file goes to the
      // shared /api/uploads endpoint, which validates and stores it, and
      // only the returned public path is written onto the record.
      let image: string | null | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subdir", "plate-categories");
        const uploaded = await apiFetch<{ url: string }>("/api/uploads", {
          method: "POST",
          body: formData,
          silentErrors: true,
        });
        image = uploaded.url;
      } else if (imageCleared) {
        image = null;
      } else if (mode === "create") {
        image = null;
      }
      // Otherwise `image` stays undefined so an edit that did not touch the
      // field leaves the stored artwork untouched.

      const payload = image === undefined ? data : { ...data, image };

      if (mode === "create") {
        await apiFetch("/api/plate-categories", {
          method: "POST",
          body: JSON.stringify(payload),
          silentErrors: true,
        });
        push(t("admin.categoryCreated"), "success");
      } else {
        await apiFetch(`/api/plate-categories/${initial!._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
          silentErrors: true,
        });
        push(t("admin.categoryUpdated"), "success");
      }
      router.push("/admin/plate-categories");
      router.refresh();
    } catch (err) {
      applyApiError(err, mode === "create" ? t("admin.categoryCreateFailed") : t("admin.categoryUpdateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardBody className="flex flex-col gap-5">
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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

          <ImageDropzone
            id="plate-category-image-input"
            label={t("admin.categoryImageLabel")}
            existingUrl={storedImage}
            file={file}
            onPick={handlePick}
            onRemove={handleRemove}
            error={errorFor("image")}
            disabled={loading}
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

          {formError && (
            <p role="alert" className="text-sm font-medium text-(--color-danger)">
              {formError}
            </p>
          )}

          <Button type="submit" variant="gold" size="lg" loading={loading} disabled={loading} className="mt-1">
            {t("admin.saveCategoryButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
