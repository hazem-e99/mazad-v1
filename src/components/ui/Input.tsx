"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, controlClasses, controlHeight, useFieldControl } from "@/components/ui/Field";

interface CommonFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

/* ── Text input ─────────────────────────────────────────────────────────
   `leading` renders a fixed adornment inside the control (currency, a
   search glyph) — the control keeps a single border so the adornment does
   not read as a separate button. */
interface InputProps extends InputHTMLAttributes<HTMLInputElement>, CommonFieldProps {
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fieldClassName, label, error, hint, id, leading, trailing, required, ...props }, ref) => (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={fieldClassName}>
      <InputControl ref={ref} className={className} leading={leading} trailing={trailing} required={required} {...props} />
    </Field>
  )
);
Input.displayName = "Input";

/** The bare control, for the rare caller that supplies its own label
 * chrome (inline toolbars, table filters). */
export const InputControl = forwardRef<HTMLInputElement, Omit<InputProps, "label" | "error" | "hint">>(
  ({ className, id, leading, trailing, ...props }, ref) => {
    const aria = useFieldControl(id);

    if (!leading && !trailing) {
      return <input ref={ref} {...aria} className={cn(controlClasses, controlHeight, className)} {...props} />;
    }

    return (
      <div
        className={cn(
          controlClasses,
          controlHeight,
          "flex items-center gap-2 px-3 focus-within:border-(--color-gold)/60 focus-within:ring-2 focus-within:ring-(--color-gold)/25",
          className
        )}
      >
        {leading && (
          <span className="shrink-0 text-(--color-text-faint)" aria-hidden="true">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          {...aria}
          className="min-w-0 flex-1 bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-faint) focus:outline-none"
          {...props}
        />
        {trailing && <span className="shrink-0 text-(--color-text-faint)">{trailing}</span>}
      </div>
    );
  }
);
InputControl.displayName = "InputControl";

/* ── Select ─────────────────────────────────────────────────────────────
   A native <select> keeps the OS picker on mobile and full keyboard
   support for free; only the chevron is custom so it can sit on the
   correct side under RTL. */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, CommonFieldProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fieldClassName, label, error, hint, id, required, children, ...props }, ref) => (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={fieldClassName}>
      <SelectControl ref={ref} className={className} required={required} {...props}>
        {children}
      </SelectControl>
    </Field>
  )
);
Select.displayName = "Select";

export const SelectControl = forwardRef<HTMLSelectElement, Omit<SelectProps, "label" | "error" | "hint">>(
  ({ className, id, children, ...props }, ref) => {
    const aria = useFieldControl(id);
    return (
      <div className="relative flex min-w-0 items-center">
        <select
          ref={ref}
          {...aria}
          className={cn(controlClasses, controlHeight, "appearance-none pe-9 [&>option]:bg-(--color-bg-elevated)", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-3 h-4 w-4 text-(--color-text-faint)"
          aria-hidden="true"
          strokeWidth={2}
        />
      </div>
    );
  }
);
SelectControl.displayName = "SelectControl";

/* ── Textarea ───────────────────────────────────────────────────────── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, CommonFieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, fieldClassName, label, error, hint, id, required, ...props }, ref) => {
    const inner = <TextareaControl ref={ref} className={className} required={required} {...props} />;
    return (
      <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={fieldClassName}>
        {inner}
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";

export const TextareaControl = forwardRef<HTMLTextAreaElement, Omit<TextareaProps, "label" | "error" | "hint">>(
  ({ className, id, rows = 4, ...props }, ref) => {
    const aria = useFieldControl(id);
    return <textarea ref={ref} rows={rows} {...aria} className={cn(controlClasses, "py-2.5 leading-relaxed", className)} {...props} />;
  }
);
TextareaControl.displayName = "TextareaControl";

/* ── Checkbox / switch ──────────────────────────────────────────────── */
export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const aria = useFieldControl(props.id);
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-3.5",
        "transition-colors duration-(--duration-fast) hover:border-(--color-border-strong) has-checked:border-(--color-gold)/45 has-checked:bg-(--color-gold-tint)",
        className
      )}
    >
      <input
        type="checkbox"
        {...aria}
        className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        {...props}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-(--color-text)">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-(--color-text-faint)">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-3.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-(--color-text)">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-(--color-text-faint)">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-(--duration-fast)",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-(--color-gold)" : "bg-(--color-surface-hover)"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-[inset-inline-start] duration-(--duration-fast) ease-(--ease-out-expo)",
            checked ? "start-6" : "start-1"
          )}
        />
      </button>
    </div>
  );
}
