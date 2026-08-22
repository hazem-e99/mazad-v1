"use client";

import { useToastStore } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";

const toneClasses = {
  success: "border-(--color-success)/40 bg-(--color-sold-bg) text-(--color-success)",
  error: "border-(--color-danger)/40 bg-(--color-danger)/10 text-(--color-danger)",
  info: "border-(--color-border-strong) bg-(--color-surface) text-(--color-text)",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { t: translate } = useTranslations();

  return (
    <div
      className="fixed bottom-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-(--radius-md) border px-4 py-3 text-sm shadow-(--shadow-card) flex items-center justify-between gap-3",
            toneClasses[toast.tone]
          )}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="text-current opacity-70 hover:opacity-100"
            aria-label={translate("common.close")}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
