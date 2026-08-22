import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "gold" | "secondary" | "outline" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const variantClasses: Record<Variant, string> = {
  // Gold is the single "this is the action" signal on any given screen.
  // The inset top highlight is what keeps it reading as a lit surface
  // rather than a flat swatch on the near-black background.
  gold: "bg-linear-to-b from-(--color-gold-hover) to-(--color-gold) text-(--color-gold-foreground) font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_18px_-8px_rgba(236,189,51,.55)] hover:brightness-110 active:brightness-95 focus-visible:outline-(--color-gold)",
  primary:
    "bg-(--color-brand) text-white hover:bg-(--color-brand-hover) shadow-[inset_0_1px_0_rgba(255,255,255,.12)] focus-visible:outline-(--color-brand)",
  secondary:
    "bg-(--color-surface) text-(--color-text) border border-(--color-border-strong) hover:bg-(--color-surface-hover) hover:border-(--color-gold)/30 focus-visible:outline-(--color-gold)",
  outline:
    "bg-transparent border border-(--color-border-strong) text-(--color-text) hover:bg-(--color-surface) hover:border-(--color-gold)/30 focus-visible:outline-(--color-gold)",
  ghost: "bg-transparent text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline-(--color-gold)",
  danger: "bg-(--color-danger) text-white hover:brightness-110 focus-visible:outline-(--color-danger)",
};

export const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-(--radius-sm)",
  md: "h-11 px-5 text-sm gap-2 rounded-(--radius-md)",
  lg: "h-13 px-7 text-base gap-2.5 rounded-(--radius-md)",
};

export const buttonBaseClasses =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-[filter,background-color,border-color,color,transform] duration-(--duration-fast) active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonBaseClasses, variantClasses[variant], sizeClasses[size], className)}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ href, className, variant = "primary", size = "md", children, ...props }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonBaseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Square icon-only control — pagination arrows, carousel steppers, close
 * buttons. Always needs an aria-label since it has no text. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }
>(({ className, size = "md", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border border-(--color-border-strong) bg-(--color-surface)/80 text-(--color-text-muted) backdrop-blur",
      "transition-colors duration-(--duration-fast) hover:border-(--color-gold)/40 hover:bg-(--color-surface-hover) hover:text-(--color-gold)",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
      "disabled:pointer-events-none disabled:opacity-40",
      size === "sm" ? "h-8 w-8" : "h-10 w-10",
      className
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";
