"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
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
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, fieldProps, formError, validate, applyApiError, clearField } = useFormValidation(formRef);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedSortOrder = sortOrder.trim() === "" ? 0 : Number(sortOrder);
    const data = validate(schemas.plateCategoryCreateSchema, {
      nameAr,
      nameEn,
      isActive,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : NaN,
    });
    if (!data) return;

    setLoading(true);
    try {
      if (mode === "create") {
        await apiFetch("/api/plate-categories", { method: "POST", body: JSON.stringify(data), silentErrors: true });
        push(t("admin.categoryCreated"), "success");
      } else {
        await apiFetch(`/api/plate-categories/${initial!._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
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

          <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
            {t("admin.saveCategoryButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
