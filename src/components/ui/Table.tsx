import type { HTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)",
        className
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-max text-sm", className)} {...props} />;
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-(--color-border) bg-(--color-bg-elevated) text-(--color-text-muted)",
        className
      )}
      {...props}
    />
  );
}

export function Th({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-t border-(--color-border) px-4 py-3.5 align-middle", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors duration-(--duration-fast) hover:bg-(--color-surface-hover)", className)}
      {...props}
    />
  );
}
