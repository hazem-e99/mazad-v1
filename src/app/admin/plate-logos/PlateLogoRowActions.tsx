"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateLogoDTO } from "@/types/dto";

export function PlateLogoRowActions({ logo, usageCount }: { logo: PlateLogoDTO; usageCount: number }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      await apiFetch(`/api/plate-logos/${logo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !logo.isActive }),
      });
      push(logo.isActive ? t("admin.logoDeactivated") : t("admin.logoActivated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (usageCount > 0) {
      push(t("admin.logoInUseCannotDelete"), "error");
      return;
    }
    if (!window.confirm(t("admin.confirmDeleteLogo"))) return;
    setLoading(true);
    try {
      await apiFetch(`/api/plate-logos/${logo._id}`, { method: "DELETE" });
      push(t("admin.logoDeleted"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.logoDeleteFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link href={`/admin/plate-logos/${logo._id}/edit`} className="inline-flex">
        <Button variant="ghost" size="sm" type="button">
          {t("admin.editLogoAction")}
        </Button>
      </Link>
      <Button variant="ghost" size="sm" loading={loading} onClick={toggleActive}>
        {logo.isActive ? t("admin.deactivateLogoAction") : t("admin.activateLogoAction")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={loading}
        onClick={remove}
        disabled={usageCount > 0}
        title={usageCount > 0 ? t("admin.logoInUseCannotDelete") : undefined}
        className={usageCount > 0 ? "opacity-50" : "text-(--color-danger) hover:bg-(--color-danger)/10"}
      >
        {t("admin.deleteLogoAction")}
      </Button>
    </div>
  );
}
