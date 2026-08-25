import { redirect } from "next/navigation";
import { ShieldBan } from "lucide-react";
import { getSession, hasPermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BlockedWord } from "@/models/BlockedWord";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { toBlockedWordDTOList, type LeanBlockedWord } from "@/lib/dto";
import { AddBlockedWordForm } from "./AddBlockedWordForm";
import { BlockedWordRowActions } from "./BlockedWordRowActions";

export const revalidate = 0;

/**
 * Gated by `chat:moderate` at the data layer itself (not just the admin
 * layout's "is staff" check every /admin/* page already gets) — a
 * supervisor who hasn't been granted this permission must not be able to
 * read the list, since knowing what's blocked is itself the thing regular
 * users must never learn (§ requirement: never exposed to a message
 * sender either).
 */
export default async function AdminBlockedWordsPage() {
  // Mirrors the layout's own "not staff -> redirect" gate rather than
  // throwing: a supervisor who can see the rest of /admin but wasn't
  // granted chat:moderate gets bounced to the dashboard, not a raw 403
  // error page (no error.tsx exists under /admin to render that nicely).
  const session = await getSession();
  if (!session || !hasPermission(session, "chat:moderate")) redirect("/admin");

  await connectDB();
  const { t, locale } = await getServerTranslator();

  const wordDocs = await BlockedWord.find({}).sort({ createdAt: -1 }).lean<LeanBlockedWord[]>();
  const words = toBlockedWordDTOList(wordDocs);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.blockedWordsTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.blockedWordsSubtitle")}</p>
      </div>

      <Card className="p-4 sm:p-5">
        <AddBlockedWordForm />
      </Card>

      {words.length === 0 ? (
        <EmptyState icon={ShieldBan} title={t("admin.noBlockedWordsYet")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {words.map((word) => (
              <Card key={word._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-(--color-text)" dir="auto">
                    {word.word}
                  </span>
                  {word.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}
                </div>
                <p className="text-xs text-(--color-text-faint)">{formatDateTime(word.createdAt, locale)}</p>
                <BlockedWordRowActions word={word} />
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.blockedWordLabel")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colDate")}</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <tbody>
                  {words.map((word) => (
                    <Tr key={word._id}>
                      <Td dir="auto">{word.word}</Td>
                      <Td>{word.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}</Td>
                      <Td className="hidden lg:table-cell text-xs text-(--color-text-faint)">{formatDateTime(word.createdAt, locale)}</Td>
                      <Td>
                        <BlockedWordRowActions word={word} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
        </>
      )}
    </div>
  );
}
