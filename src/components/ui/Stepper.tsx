"use client";

import { Check } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

export interface StepDefinition {
  key: string;
  label: string;
  hint?: string;
}

/**
 * Progress for a multi-step form. Completed steps become clickable so a
 * user can go back and correct an earlier answer without losing the
 * later ones; steps ahead stay inert, because the form cannot validate
 * what has not been filled in yet.
 */
export function Stepper({
  steps,
  current,
  onStepChange,
  className,
}: {
  steps: StepDefinition[];
  current: number;
  onStepChange?: (index: number) => void;
  className?: string;
}) {
  const { t } = useTranslations();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p className="text-xs font-medium text-(--color-text-faint)">
        {t("common.step", { current: current + 1, total: steps.length })}
      </p>

      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = done && Boolean(onStepChange);

          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={reachable ? () => onStepChange?.(i) : undefined}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col gap-2 text-start",
                  reachable && "cursor-pointer",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                )}
              >
                <span
                  className={cn(
                    "h-1 w-full rounded-full transition-colors duration-(--duration-base)",
                    done || active ? "bg-(--color-gold)" : "bg-(--color-surface-hover)"
                  )}
                  aria-hidden="true"
                />
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "tnum flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done
                        ? "bg-(--color-gold) text-(--color-gold-foreground)"
                        : active
                          ? "border border-(--color-gold) text-(--color-gold)"
                          : "border border-(--color-border-strong) text-(--color-text-faint)"
                    )}
                    aria-hidden="true"
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-xs font-medium sm:block",
                      active ? "text-(--color-text)" : "text-(--color-text-faint)"
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
