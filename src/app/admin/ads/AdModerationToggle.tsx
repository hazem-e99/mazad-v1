"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function AdModerationToggle({ adId, isActive }: { adId: string; isActive: boolean }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await apiFetch(`/api/ads/${adId}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) });
      push(isActive ? t("admin.adSuspended") : t("admin.adActivated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" loading={loading} onClick={toggle}>
      {isActive ? t("admin.suspendAction") : t("admin.activateAction")}
    </Button>
  );
}
