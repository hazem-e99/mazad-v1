import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** VIP presentation: warm surface, gold hairline, restrained glow. */
  vip?: boolean;
  /** Lifts and warms the border on hover — for cards that are whole links. */
  interactive?: boolean;
}

export function Card({ className, vip, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-(--radius-lg) border shadow-(--shadow-card)",
        vip
          ? "border-(--color-vip-border) bg-(--color-vip-surface) shadow-(--shadow-gold-glow)"
          : "border-(--color-border) bg-(--color-surface)",
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-expo) hover:-translate-y-1 hover:border-(--color-gold)/45 hover:shadow-(--shadow-gold-glow)",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-(--color-border) p-5", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-(--color-border) bg-black/20 p-5", className)} {...props} />;
}
