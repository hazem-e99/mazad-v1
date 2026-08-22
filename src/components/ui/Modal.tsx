"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Tints the header rule red for destructive confirmations. Only the
   * confirm button itself should carry the danger fill. */
  danger?: boolean;
}

const sizeClasses = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

/**
 * Built on <dialog> so focus trapping, Escape-to-close, inertness of the
 * page behind, and top-layer stacking come from the platform rather than
 * from hand-rolled key handlers that tend to leak focus.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", danger }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // `cancel` fires for Escape and for the backdrop dismissal gesture;
      // preventing the default close keeps React's `open` prop the single
      // source of truth instead of letting the DOM drift out of sync.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="mz-modal-title"
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-(--radius-xl) border border-(--color-border-strong) bg-(--color-surface) p-0 text-(--color-text) shadow-(--shadow-elevated)",
        "backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        sizeClasses[size]
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 id="mz-modal-title" className="text-lg font-bold tracking-tight text-(--color-text)">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="-me-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-text-faint) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-gold)"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </div>

      <div className={cn("h-px", danger ? "bg-(--color-danger)/30" : "bg-(--color-border)")} aria-hidden="true" />

      {children && <div className="max-h-[60vh] overflow-y-auto p-5">{children}</div>}

      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-(--color-border) bg-(--color-bg-elevated) p-5">
          {footer}
        </div>
      )}
    </dialog>
  );
}
