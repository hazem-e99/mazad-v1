"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { UserStatus } from "@/lib/constants";

/** Suspend/reactivate/delete — the three destructive-ish account actions
 * that don't need the full role/permission editor modal. Confirms via the
 * browser's native dialog rather than a custom one: these are simple
 * yes/no decisions, not worth a bespoke modal component. */
export function UserQuickActions({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);

  async function toggleStatus() {
    const suspending = status === "active";
    if (!window.confirm(t(suspending ? "admin.confirmSuspendUser" : "admin.confirmReactivateUser"))) return;
    setLoading("toggle");
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: suspending ? "suspended" : "active" }),
      });
      push(t(suspending ? "admin.userSuspended" : "admin.userReactivated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.userUpdateFailed"), "error");
    } finally {
      setLoading(null);
    }
  }

  async function deleteUser() {
    if (!window.confirm(t("admin.confirmDeleteUser"))) return;
    setLoading("delete");
    try {
      await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
      push(t("admin.userDeleted"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.userDeleteFailed"), "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={toggleStatus} loading={loading === "toggle"}>
        {t(status === "active" ? "admin.actionSuspend" : "admin.actionReactivate")}
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteUser} loading={loading === "delete"} className="text-(--color-danger)">
        {t("admin.actionDelete")}
      </Button>
    </div>
  );
}
