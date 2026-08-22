"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { VipBadge } from "@/components/ui/VipBadge";
import { plateTypeLabel } from "@/lib/constants";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import type { PlateDTO } from "@/types/dto";

/**
 * A plate presented on its own — no auction attached. Used by the VIP
 * carousel and the VIP landing grid, and by "my plates" with a different
 * footer passed in.
 */
export function VipPlateCard({
  plate,
  href,
  footer,
  className,
}: {
  plate: PlateDTO;
  href?: string;
  /** Replaces the default type caption — status chips, row actions. */
  footer?: ReactNode;
  className?: string;
}) {
  const { locale } = useTranslations();

  const body = (
    <>
      <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-x-0 -top-8 h-40 opacity-70" />

      <div className="relative flex items-center justify-between gap-2">
        {plate.isVip ? <VipBadge /> : <span className="text-xs text-(--color-text-faint)">{plateTypeLabel(plate.type, locale)}</span>}
      </div>

      <div className="relative flex flex-1 items-center justify-center py-4">
        <SaudiPlate
          type={plate.type}
          lettersAr={plate.lettersAr}
          lettersEn={plate.lettersEn}
          numbers={plate.numbers}
          logo={plate.logo}
          size="md"
          vip={plate.isVip}
          locale={locale}
          className="transition-transform duration-(--duration-base) ease-(--ease-out-expo) group-hover:scale-[1.015]"
        />
      </div>

      <div className="relative border-t border-(--color-border) pt-3.5">
        {footer ?? (
          <span className="text-xs text-(--color-text-muted)">{plateTypeLabel(plate.type, locale)}</span>
        )}
      </div>
    </>
  );

  const shell = cn(
    "group relative flex min-w-0 flex-col overflow-hidden rounded-(--radius-lg) border p-5 shadow-(--shadow-card)",
    "border-(--color-vip-border) bg-(--color-vip-surface)",
    "transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-expo)",
    "hover:-translate-y-1 hover:border-(--color-gold)/60 hover:shadow-(--shadow-gold-glow)",
    className
  );

  if (!href) return <article className={shell}>{body}</article>;

  return (
    <Link
      href={href}
      className={cn(
        shell,
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      )}
    >
      {body}
    </Link>
  );
}
