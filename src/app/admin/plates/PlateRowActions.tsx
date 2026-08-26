"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      await apiFetch(`/api/plates/${plateId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      push(isVisible ? t("admin.plateHiddenToast") : t("admin.plateShownToast"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/api/plates/${plateId}`, { method: "DELETE" });
      push(t("admin.plateDeletedToast"), "success");
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="ghost" size="sm" loading={loading} disabled={loading || deleting} onClick={toggleVip}>
          {isVip ? t("admin.unvipAction") : t("admin.vipAction")}
        </Button>
        <Button variant="ghost" size="sm" loading={loading} disabled={loading || deleting} onClick={toggleVisible}>
          {isVisible ? t("admin.hideAction") : t("admin.showAction")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || deleting}
          onClick={() => setDeleteOpen(true)}
          className="text-(--color-danger) hover:text-(--color-danger)"
          aria-label={t("admin.deletePlateAction")}
        >
          <Trash2 className="h-4 w-4" />
          <span>{t("admin.deletePlateAction")}</span>
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t("admin.confirmDeletePlateTitle")}
        description={t("admin.confirmDeletePlateBody")}
        confirmLabel={t("admin.deletePlateAction")}
        loading={deleting}
        danger
      />
    </>
  );
}

