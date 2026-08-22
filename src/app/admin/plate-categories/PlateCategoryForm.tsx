"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
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
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { nameAr, nameEn, isActive, sortOrder: Number(sortOrder) || 0 };
      if (mode === "create") {
        await apiFetch("/api/plate-categories", { method: "POST", body: JSON.stringify(payload) });
        push(t("admin.categoryCreated"), "success");
      } else {
        await apiFetch(`/api/plate-categories/${initial!._id}`, { method: "PATCH", body: JSON.stringify(payload) });
        push(t("admin.categoryUpdated"), "success");
      }
      router.push("/admin/plate-categories");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : mode === "create" ? t("admin.categoryCreateFailed") : t("admin.categoryUpdateFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardBody className="flex flex-col gap-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input label={t("admin.colNameAr")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
          <Input label={t("admin.colNameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" />
          <Input label={t("admin.logoSortOrderLabel")} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />

          <label className="flex items-center gap-2.5 text-sm text-(--color-text)">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-(--color-gold)" />
            {t("admin.logoActiveLabel")}
          </label>

          {error && <p className="text-sm text-(--color-danger)">{error}</p>}

          <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
            {t("admin.saveCategoryButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
