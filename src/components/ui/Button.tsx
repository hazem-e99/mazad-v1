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
  primary: "bg-(--color-brand) text-white hover:bg-(--color-brand-hover) focus-visible:outline-(--color-brand)",
  gold: "bg-(--color-gold) text-(--color-gold-foreground) hover:bg-(--color-gold-hover) focus-visible:outline-(--color-gold) font-semibold",
  secondary: "bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-hover) border border-(--color-border)",
  outline: "bg-transparent border border-(--color-border-strong) text-(--color-text) hover:bg-(--color-surface)",
  ghost: "bg-transparent text-(--color-text) hover:bg-(--color-surface)",
  danger: "bg-(--color-danger) text-white hover:brightness-110",
};

export const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const buttonBaseClasses =
  "inline-flex items-center justify-center rounded-(--radius-md) font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

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
