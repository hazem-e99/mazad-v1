import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Every account route is viewer-scoped; there is nothing meaningful to
  // render without a session, so gate once here rather than in each page.
  if (!session) redirect("/login");

  const { t } = await getServerTranslator();

  return (
    <div className="mz-container py-10">
      <PageHeader icon={UserRound} title={t("account.title")} subtitle={t("account.subtitle")} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[15rem_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
