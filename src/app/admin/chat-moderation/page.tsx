import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getSession, hasPermission } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import { ChatMessage } from "@/models/ChatMessage";
import { User } from "@/models/User";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import {
  toChatModerationLogDTOList,
  toChatMessageDTOList,
  type LeanChatModerationLog,
  type LeanChatMessage,
} from "@/lib/dto";
import { chatViolationTypeLabel, chatModerationLogStatusLabel } from "@/lib/constants";
import { ChatModerationLogRowActions } from "./ChatModerationLogRowActions";
import { BlockUserButton } from "./BlockUserButton";
import { LiveChatMessagesFeed } from "./LiveChatMessagesFeed";
import { ClearChatButton } from "./ClearChatButton";

export const revalidate = 0;

const LOGS_PER_PAGE = 20;
const RECENT_MESSAGES_LIMIT = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminChatModerationPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session || !hasPermission(session, "chat:moderate")) redirect("/admin");

  await connectDB();
  const { t, locale } = await getServerTranslator();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [logDocs, total, messageDocs, violationUserCounts] = await Promise.all([
    ChatModerationLog.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * LOGS_PER_PAGE)
      .limit(LOGS_PER_PAGE)
      .populate("user", "name phone")
      .lean<LeanChatModerationLog[]>(),
    ChatModerationLog.countDocuments({}),
    ChatMessage.find({}).sort({ createdAt: -1 }).limit(RECENT_MESSAGES_LIMIT).populate("user", "name").lean<LeanChatMessage[]>(),
    // Per-user violation count — shown next to each log row so a moderator
    // can see repeat offenders at a glance without opening every entry.
    ChatModerationLog.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$user", count: { $sum: 1 } } }]),
  ]);

  const logs = toChatModerationLogDTOList(logDocs);
  const messages = toChatMessageDTOList(messageDocs);
  const pages = Math.max(1, Math.ceil(total / LOGS_PER_PAGE));

  const violationCountByUser = new Map(violationUserCounts.map((row) => [String(row._id), row.count]));

  // Both tables need to know who's currently chat-blocked to render the
  // block/unblock toggle correctly — one lookup covers both rather than
  // extending the shared UserContactRefDTO/UserRefDTO used everywhere
  // else in the app.
  const userIds = Array.from(
    new Set([...logs.map((l) => l.user?._id).filter(Boolean), ...messages.map((m) => m.user._id).filter(Boolean)])
  ) as string[];
  const blockedRows = await User.find({ _id: { $in: userIds } })
    .select("chatBlocked")
    .lean<{ _id: { toString(): string }; chatBlocked?: boolean }[]>();
  const blockedByUser = new Map(blockedRows.map((row) => [String(row._id), Boolean(row.chatBlocked)]));
  // Client components can't receive a Map as a prop across the server
  // boundary — LiveChatMessagesFeed gets the plain-object form.
  const blockedByUserObj = Object.fromEntries(blockedByUser);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.chatModerationTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.chatModerationSubtitle")}</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold text-(--color-text)">{t("admin.chatViolationsHeader")}</h2>
        </CardHeader>
        {logs.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ShieldAlert} title={t("admin.noChatViolationsYet")} />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 p-4 sm:hidden">
              {logs.map((log) => (
                <Card key={log._id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-(--color-text)">{log.user?.name ?? "—"}</p>
                      <p className="text-xs text-(--color-text-faint)" dir="ltr">
                        {log.user?.phone}
                      </p>
                    </div>
                    <Badge tone={log.status === "pending" ? "gold" : "neutral"}>
                      {chatModerationLogStatusLabel(log.status, locale)}
                    </Badge>
                  </div>
                  <p className="text-sm text-(--color-text-muted) break-words">{log.messageText}</p>
                  <p className="text-xs text-(--color-text-faint)">
                    {chatViolationTypeLabel(log.violationType, locale)} · {formatDateTime(log.createdAt, locale)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ChatModerationLogRowActions log={log} />
                    {log.user && (
                      <BlockUserButton userId={log.user._id} isBlocked={blockedByUser.get(log.user._id) ?? false} />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="hidden sm:block">
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>{t("admin.colUser")}</Th>
                      <Th>{t("admin.colViolationMessage")}</Th>
                      <Th>{t("admin.colViolationReason")}</Th>
                      <Th>{t("admin.colUserViolationCount")}</Th>
                      <Th>{t("common.status")}</Th>
                      <Th>{t("admin.colDate")}</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <tbody>
                    {logs.map((log) => (
                      <Tr key={log._id}>
                        <Td>
                          {log.user?.name ?? "—"}
                          <span className="block text-xs text-(--color-text-faint)" dir="ltr">
                            {log.user?.phone}
                          </span>
                        </Td>
                        <Td className="max-w-xs break-words">{log.messageText}</Td>
                        <Td className="text-xs text-(--color-text-faint)">{chatViolationTypeLabel(log.violationType, locale)}</Td>
                        <Td className="tnum">{log.user ? (violationCountByUser.get(log.user._id) ?? 1) : "—"}</Td>
                        <Td>
                          <Badge tone={log.status === "pending" ? "gold" : "neutral"}>
                            {chatModerationLogStatusLabel(log.status, locale)}
                          </Badge>
                        </Td>
                        <Td className="text-xs text-(--color-text-faint)">{formatDateTime(log.createdAt, locale)}</Td>
                        <Td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <ChatModerationLogRowActions log={log} />
                            {log.user && (
                              <BlockUserButton userId={log.user._id} isBlocked={blockedByUser.get(log.user._id) ?? false} />
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={page} pages={pages} total={total} />
              </TableContainer>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-(--color-text)">{t("admin.recentChatMessagesHeader")}</h2>
          <ClearChatButton />
        </CardHeader>
        <LiveChatMessagesFeed initial={messages} blockedByUser={blockedByUserObj} />
      </Card>
    </div>
  );
}
