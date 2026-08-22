"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function LogoutButton() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmLogout() {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      push(t("admin.logoutSuccess"), "success");
      router.push("/");
      router.refresh();
    } catch {
      push(t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-(--radius-lg) border border-(--color-danger)/25 bg-(--color-danger)/8 p-5">
        <div className="min-w-0">
          <p className="font-medium text-(--color-text)">{t("admin.logoutAction")}</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">{t("account.securityHint")}</p>
        </div>
        <Button variant="danger" size="md" onClick={() => setOpen(true)} className="shrink-0">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("admin.logoutAction")}
        </Button>
      </div>

      <Modal
        open={open}
        danger
        onClose={() => setOpen(false)}
        title={t("admin.logoutAction")}
        description={t("account.securityHint")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" size="md" loading={loading} onClick={confirmLogout}>
              {t("admin.logoutAction")}
            </Button>
          </>
        }
      />
    </>
  );
}
