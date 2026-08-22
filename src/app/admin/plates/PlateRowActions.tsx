"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function PlateRowActions({
  plateId,
  isVip,
  isVisible,
}: {
  plateId: string;
  isVip: boolean;
  isVisible: boolean;
}) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggleVip() {
    setLoading(true);
    try {
      await apiFetch(`/api/plates/${plateId}`, { method: "PATCH", body: JSON.stringify({ isVip: !isVip }) });
      push(isVip ? t("admin.vipRemoved") : t("admin.vipMarked"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisible() {
    setLoading(true);
    try {
      if (isVisible) {
        await apiFetch(`/api/plates/${plateId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/plates/${plateId}`, { method: "PATCH", body: JSON.stringify({ isVisible: true }) });
      }
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" loading={loading} onClick={toggleVip}>
        {isVip ? t("admin.unvipAction") : t("admin.vipAction")}
      </Button>
      <Button variant="ghost" size="sm" loading={loading} onClick={toggleVisible}>
        {isVisible ? t("admin.hideAction") : t("admin.showAction")}
      </Button>
    </div>
  );
}
