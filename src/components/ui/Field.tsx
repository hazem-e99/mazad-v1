"use client";

import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One label/hint/error shell shared by every control, so a text input, a
 * select, a file picker and a date picker all sit on the same baseline
 * grid and announce their errors the same way. Controls read the ids they
 * need from context instead of each re-implementing useId + aria wiring.
 */
interface FieldContextValue {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldControl(idOverride?: string) {
  const ctx = useContext(FieldContext);
  const fallbackId = useId();
  if (!ctx) return { id: idOverride ?? fallbackId, "aria-describedby": undefined, "aria-invalid": undefined };
  return {
    id: idOverride ?? ctx.controlId,
    "aria-describedby": ctx.describedBy,
    "aria-invalid": ctx.invalid || undefined,
  };
}

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, required, className, htmlFor, children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const errorId = error ? `${controlId}-error` : undefined;
  const hintId = hint && !error ? `${controlId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex min-w-0 flex-col gap-2", className)}>
        {label && (
          <label htmlFor={controlId} className="text-sm font-medium text-(--color-text)">
            {label}
            {required && (
              <span className="ms-1 text-(--color-gold)" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {children}
        {hint && !error && (
          <p id={hintId} className="text-xs text-(--color-text-faint)">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-(--color-danger)">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

/** Shared visual treatment for every text-like control. Focus is a gold
 * ring — the one place gold appears on an otherwise quiet form. */
export const controlClasses = cn(
  "w-full min-w-0 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated)",
  "px-3.5 text-sm text-(--color-text) placeholder:text-(--color-text-faint)",
  "transition-[border-color,box-shadow] duration-(--duration-fast)",
  "hover:border-(--color-border-strong) focus:border-(--color-gold)/60 focus:outline-none focus:ring-2 focus:ring-(--color-gold)/25",
  "aria-[invalid=true]:border-(--color-danger) aria-[invalid=true]:focus:ring-(--color-danger)/25",
  "disabled:cursor-not-allowed disabled:bg-(--color-surface) disabled:text-(--color-text-faint) disabled:opacity-70"
);

export const controlHeight = "h-11";
