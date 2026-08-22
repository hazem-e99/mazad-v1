import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n-server";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: LucideIcon;
  /** Controls rendered opposite the title, such as carousel steppers. */
  actions?: ReactNode;
  className?: string;
}

/**
 * A server component like its siblings `PageHeader` and `EmptyState`: the
 * `icon` prop is a component reference, which cannot cross the RSC
 * boundary, so the pages that pass `icon={Crown}` need this to render on
 * the server. The locale switcher calls `router.refresh()`, so reading the
 * translation from the cookie here still updates on a language change.
 */
export async function SectionHeader({
  title,
  subtitle,
  href,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) {
  const { t, locale } = await getServerTranslator();
  // The "view all" arrow must point away from the text in both directions.
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        <h2 className="mz-display flex items-center gap-3 text-(--color-text)">
          {Icon && <Icon className="h-6 w-6 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.6} />}
          {title}
        </h2>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-6 text-(--color-text-muted)">{subtitle}</p>}
      </div>

      {(actions || href) && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1.5 text-sm font-semibold text-(--color-text-muted) transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            >
              {t("home.viewAll")}
              <Arrow className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
