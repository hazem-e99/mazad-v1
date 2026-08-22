"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Which physical edge the panel is anchored to. Defaults to the
   * document's *start* edge — right in Arabic, left in English — so a
   * navigation drawer always opens from the side the reader's eye is
   * already on. */
  side?: "start" | "end";
  className?: string;
}

export function Drawer({ open, onClose, title, children, footer, side = "start", className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t, locale } = useTranslations();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // `dialog` is positioned with physical properties, so resolve the
  // logical side against the active locale once, here.
  const rtl = locale === "ar";
  const onRight = side === "start" ? rtl : !rtl;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="mz-drawer-title"
      className={cn(
        "fixed top-0 m-0 h-dvh max-h-none w-[min(22rem,88vw)] max-w-none border-(--color-border) bg-(--color-bg-elevated) p-0 text-(--color-text) shadow-(--shadow-elevated)",
        "backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        onRight ? "right-0 left-auto border-s" : "left-0 right-auto border-e",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--color-border) px-5 py-4">
          <h2 id="mz-drawer-title" className="text-base font-bold tracking-tight text-(--color-text)">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-text-faint) transition-colors hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-gold)"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>

        {footer && <div className="shrink-0 border-t border-(--color-border) bg-black/20 p-4">{footer}</div>}
      </div>
    </dialog>
  );
}
