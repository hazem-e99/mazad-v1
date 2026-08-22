import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n-server";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  /** Small icon rendered inside the eyebrow chip beside the title. */
  icon?: LucideIcon;
  /** Short eyebrow label above the title — "مباشر", "حصري". */
  eyebrow?: string;
  eyebrowTone?: "gold" | "live";
  /** Controls rendered opposite the title (carousel steppers). */
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
  eyebrow,
  eyebrowTone = "gold",
  actions,
  className,
}: SectionHeaderProps) {
  const { t, locale } = await getServerTranslator();
  // The "view all" arrow must point *away* from the text in both
  // directions, so it flips with the locale rather than being mirrored by
  // the browser (which would also mirror the glyph's optical weight).
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <span
            className={cn(
              "mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              eyebrowTone === "live"
                ? "border-(--color-live)/25 bg-(--color-live-bg) text-(--color-live)"
                : "border-(--color-gold)/25 bg-(--color-gold-tint) text-(--color-gold)"
            )}
          >
            {eyebrowTone === "live" && (
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            )}
            {eyebrow}
          </span>
        )}
        <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-(--color-text) sm:text-[1.75rem]">
          {Icon && <Icon className="h-6 w-6 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />}
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm text-(--color-text-muted)">{subtitle}</p>}
      </div>

      {(actions || href) && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1.5 text-sm font-semibold text-(--color-gold) transition-colors hover:text-(--color-gold-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
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
