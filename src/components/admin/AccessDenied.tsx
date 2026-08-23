import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n-server";

/**
 * What a staff member sees where a screen their permissions do not cover
 * would have been.
 *
 * Rendered *in place of* the section's content, so it arrives inside the
 * dashboard chrome with the sidebar still there — someone who mistyped a
 * URL or followed a stale link can carry on rather than being bounced to
 * a bare error page.
 *
 * Deliberately distinct from not-found: the screen exists, and saying so
 * is what tells a supervisor to ask an admin for the entitlement instead
 * of assuming the link is broken. Nothing about the screen's contents is
 * described here, and this is presentation only — the route's data is
 * never fetched, because the guard returns before the page runs.
 */
export async function AccessDenied() {
  const { t } = await getServerTranslator();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-(--color-danger)">
        <ShieldAlert className="h-7 w-7" aria-hidden="true" strokeWidth={1.6} />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-(--color-text)">{t("errors.forbiddenTitle")}</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-(--color-text-muted)">{t("errors.forbiddenHint")}</p>

      <Link
        href="/admin"
        className="mt-8 inline-flex h-11 items-center rounded-(--radius-md) border border-(--color-border-strong) px-5 text-sm font-semibold text-(--color-text) transition-colors hover:border-(--color-gold)/55 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
      >
        {t("nav.dashboard")}
      </Link>
    </div>
  );
}
