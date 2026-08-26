"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  danger = true,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslations();

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      danger={danger}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            size="sm"
            loading={loading}
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? (danger ? t("common.delete") : t("common.confirm"))}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
