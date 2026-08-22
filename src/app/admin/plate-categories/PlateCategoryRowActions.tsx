"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateCategoryDTO } from "@/types/dto";

export function PlateCategoryRowActions({ category, usageCount }: { category: PlateCategoryDTO; usageCount: number }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      await apiFetch(`/api/plate-categories/${category._id}`, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) });
      push(category.isActive ? t("admin.categoryDeactivated") : t("admin.categoryActivated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.confirmDeleteCategory"))) return;
    setLoading(true);
    try {
      await apiFetch(`/api/plate-categories/${category._id}`, { method: "DELETE" });
      push(t("admin.categoryDeleted"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.categoryDeleteFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/plate-categories/${category._id}/edit`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover)">
        {t("admin.editLogoAction")}
      </Link>
      <Button size="sm" variant="ghost" loading={loading} onClick={toggleActive}>
        {category.isActive ? t("admin.deactivateLogoAction") : t("admin.activateLogoAction")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        loading={loading}
        onClick={remove}
        disabled={usageCount > 0}
        title={usageCount > 0 ? t("admin.categoryInUseCannotDelete") : undefined}
      >
        {t("admin.deleteLogoAction")}
      </Button>
    </div>
  );
}
