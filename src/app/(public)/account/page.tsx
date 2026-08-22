import { notFound } from "next/navigation";
import { IdCard, TrendingUp, Trophy, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { getAccountUser, getUserPlates, getUserBids } from "@/lib/accountQueries";
import { StatCard } from "@/components/ui/StatCard";
import { LinkButton } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";

export const revalidate = 0;

const roleKey = { admin: "admin.roleAdmin", supervisor: "admin.roleSupervisor", user: "admin.roleUser" } as const;

export default async function AccountProfilePage() {
  const session = await getSession();
  if (!session) notFound();

  const [user, plates, bids, { t, locale }] = await Promise.all([
    getAccountUser(session.sub),
    getUserPlates(session.sub),
    getUserBids(session.sub),
    getServerTranslator(),
  ]);

  if (!user) notFound();

  const activeBids = bids.filter((entry) => entry.auction.status === "live").length;
  const wonBids = bids.filter((entry) => entry.hasWon).length;

  const details = [
    { label: t("account.fieldName"), value: user.name },
    { label: t("account.fieldPhone"), value: user.phone, numeric: true },
    { label: t("account.fieldEmail"), value: user.email ?? "—" },
    { label: t("account.fieldRole"), value: t(roleKey[user.role]) },
    { label: t("account.memberSince"), value: formatDateTime(user.createdAt, locale), numeric: true },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("account.statPlates")} value={plates.length} icon={IdCard} />
        <StatCard label={t("account.statActiveBids")} value={activeBids} icon={TrendingUp} tone="live" />
        <StatCard label={t("account.statWon")} value={wonBids} icon={Trophy} tone="success" />
      </div>

      <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) p-5">
          <div>
            <h2 className="font-semibold text-(--color-text)">{t("account.profileTitle")}</h2>
            <p className="mt-1 text-sm text-(--color-text-muted)">{t("account.profileSubtitle")}</p>
          </div>
          <LinkButton href="/plates/new" variant="secondary" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.addPlate")}
          </LinkButton>
        </div>

        <dl className="grid grid-cols-1 gap-px bg-(--color-border) sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="bg-(--color-surface) p-5">
              <dt className="text-xs text-(--color-text-faint)">{detail.label}</dt>
              <dd className={"mt-1.5 font-medium text-(--color-text) " + (detail.numeric ? "tnum" : "")}>
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
