import { notFound } from "next/navigation";
import { ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { getAccountUser } from "@/lib/accountQueries";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/account/LogoutButton";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export const revalidate = 0;

export default async function AccountSecurityPage() {
  const session = await getSession();
  if (!session) notFound();

  const [user, { t }] = await Promise.all([getAccountUser(session.sub), getServerTranslator()]);
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{t("account.securityTitle")}</h2>
        <p className="mt-1 text-sm text-(--color-text-muted)">{t("account.securitySubtitle")}</p>
      </div>

      <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
        <div className="flex items-start gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-sold)/20 bg-(--color-sold-bg) text-(--color-sold)">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-(--color-text)">{t("account.securityTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">{t("account.securityHint")}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-px border-t border-(--color-border) bg-(--color-border) sm:grid-cols-2">
          <div className="flex items-center gap-3 bg-(--color-surface) p-5">
            <Smartphone className="h-4 w-4 shrink-0 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.75} />
            <div className="min-w-0">
              <dt className="text-xs text-(--color-text-faint)">{t("account.fieldPhone")}</dt>
              <dd className="tnum mt-0.5 font-medium text-(--color-text)">{user.phone}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-(--color-surface) p-5">
            <KeyRound className="h-4 w-4 shrink-0 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.75} />
            <div className="min-w-0">
              <dt className="text-xs text-(--color-text-faint)">{t("auth.password")}</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <span className="font-medium tracking-widest text-(--color-text)">••••••••</span>
                <Badge tone={user.isActive ? "success" : "danger"}>
                  {user.isActive ? t("common.active") : t("common.suspended")}
                </Badge>
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <ChangePasswordForm />

      <LogoutButton />
    </div>
  );
}
