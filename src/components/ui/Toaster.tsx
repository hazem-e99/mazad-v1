"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/components/i18n/LocaleProvider";

const toneClasses = {
  success: "border-(--color-sold)/35 bg-(--color-sold-bg) text-(--color-sold)",
  error: "border-(--color-danger)/35 bg-(--color-danger)/12 text-(--color-danger)",
  info: "border-(--color-gold)/30 bg-(--color-gold-tint) text-(--color-gold)",
};

const toneIcon = { success: CheckCircle2, error: AlertCircle, info: Info };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { t: translate } = useTranslations();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2.5 px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const Icon = toneIcon[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "animate-rise-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-(--radius-md) border px-4 py-3 text-sm shadow-(--shadow-elevated) backdrop-blur",
              toneClasses[toast.tone]
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" strokeWidth={2} />
            <span className="min-w-0 flex-1 text-(--color-text)">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-full p-1 text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
              aria-label={translate("common.close")}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
