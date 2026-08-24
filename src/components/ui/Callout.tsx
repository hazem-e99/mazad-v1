import type { ReactNode, ComponentType } from "react";
import { cn } from "@/lib/cn";

export type CalloutTone = "info";

const toneClasses: Record<CalloutTone, string> = {
  info: "border-(--color-info)/30 bg-(--color-info)/10",
};

const iconToneClasses: Record<CalloutTone, string> = {
  info: "text-(--color-info)",
};

interface CalloutProps {
  tone?: CalloutTone;
  icon?: ComponentType<{ className?: string }>;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A bordered, tinted notice box — reused for both the friendly "here's how
 * to do this well" tips and the "here's what happens to this file" privacy
 * notices, so the two only ever differ by tone/icon/copy, never by markup. */
export function Callout({ tone = "info", icon: Icon, title, children, className }: CalloutProps) {
  return (
    <div className={cn("flex gap-3 rounded-(--radius-lg) border p-4", toneClasses[tone], className)}>
      {Icon && (
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconToneClasses[tone])} aria-hidden="true" strokeWidth={1.75} />
      )}
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        {title && <p className="font-semibold text-(--color-text)">{title}</p>}
        {children && <div className="leading-relaxed text-(--color-text-muted)">{children}</div>}
      </div>
    </div>
  );
}
