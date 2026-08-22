import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "live" | "gold" | "success" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral: "text-(--color-text)",
  live: "text-(--color-live)",
  gold: "text-(--color-gold)",
  success: "text-(--color-sold)",
  muted: "text-(--color-text-faint)",
};

const iconToneClasses: Record<Tone, string> = {
  neutral: "bg-(--color-surface-hover) text-(--color-text-muted)",
  live: "bg-(--color-live-bg) text-(--color-live)",
  gold: "bg-(--color-vip-bg) text-(--color-gold)",
  success: "bg-(--color-sold-bg) text-(--color-sold)",
  muted: "bg-(--color-surface-hover) text-(--color-text-faint)",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="p-4 flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs text-(--color-text-muted) truncate">{label}</span>
        <span className={cn("tnum text-2xl font-bold", toneClasses[tone])}>{value}</span>
      </div>
      {Icon && (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-md)", iconToneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" strokeWidth={2} />
        </span>
      )}
    </Card>
  );
}
