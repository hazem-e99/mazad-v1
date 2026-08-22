import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-(--radius-lg) border border-dashed border-(--color-border) bg-(--color-bg-elevated)/40 py-14 px-6 text-center">
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-(--color-surface) text-(--color-text-faint)">
          <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
        </span>
      )}
      <p className="text-(--color-text) font-medium">{title}</p>
      {description && <p className="text-sm text-(--color-text-muted) mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
