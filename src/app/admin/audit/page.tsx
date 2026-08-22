import Link from "next/link";
import { History, PlusCircle, Pencil, Flag, Activity, type LucideIcon } from "lucide-react";
import { getPaginatedAuditLogs } from "@/lib/adminQueries";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";

export const revalidate = 0;

const ENTITY_TYPES = ["Auction", "Plate", "User", "Advertisement"];

const entityTone: Record<string, "gold" | "scheduled" | "neutral"> = {
  Auction: "gold",
  Plate: "neutral",
  User: "scheduled",
  Advertisement: "neutral",
};

const actionIcon: Record<string, LucideIcon> = {
  created: PlusCircle,
  updated: Pencil,
  finalized: Flag,
};

function iconForAction(action: string): LucideIcon {
  const suffix = action.split(".")[1];
  return (suffix && actionIcon[suffix]) || Activity;
}

interface Props {
  searchParams: Promise<{ action?: string; entityType?: string; page?: string }>;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ items: logs, total, page, pages }, { t, locale }] = await Promise.all([
    getPaginatedAuditLogs({
      action: params.action,
      entityType: params.entityType,
      page: params.page ? Number(params.page) : 1,
    }),
    getServerTranslator(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.auditTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.auditSubtitle")}</p>
      </div>

      <FilterBar
        searchKey="action"
        searchPlaceholder={t("admin.searchAuditPlaceholder")}
        selects={[
          {
            key: "entityType",
            label: t("admin.filterEntity"),
            options: ENTITY_TYPES.map((entityType) => ({ value: entityType, label: entityType })),
          },
        ]}
      />

      {logs.length === 0 ? (
        <EmptyState icon={History} title={t("admin.noMatchingActivity")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {logs.map((log) => {
              const Icon = iconForAction(log.action);
              const entityLink = log.entityType === "Auction" ? `/admin/auctions/${log.entityId}` : null;
              return (
                <Card key={log._id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-surface-hover) text-(--color-text-muted)">
                      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-(--color-text)">{log.actor?.name ?? "—"}</p>
                      <p className="text-xs text-(--color-text-faint)" dir="ltr">
                        {log.actor?.phone}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-(--color-text-faint)">{formatDateTime(log.createdAt, locale)}</span>
                  </div>
                  <p className="font-mono text-xs text-(--color-text-muted)">{log.action}</p>
                  <div className="flex items-center justify-between text-xs text-(--color-text-faint)">
                    <Badge tone={entityTone[log.entityType] ?? "neutral"}>{log.entityType}</Badge>
                    {entityLink ? (
                      <Link href={entityLink} className="font-mono text-(--color-gold) hover:text-(--color-gold-hover)">
                        {log.entityId.slice(-8)}
                      </Link>
                    ) : (
                      <span className="font-mono">{log.entityId.slice(-8)}</span>
                    )}
                  </div>
                </Card>
              );
            })}
            <Card>
              <Pagination page={page} pages={pages} total={total} />
            </Card>
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.colUser")}</Th>
                    <Th>{t("admin.colAction")}</Th>
                    <Th>{t("admin.colEntity")}</Th>
                    <Th className="hidden lg:table-cell">{t("admin.colId")}</Th>
                    <Th>{t("admin.colDate")}</Th>
                  </Tr>
                </Thead>
                <tbody>
                  {logs.map((log) => {
                    const Icon = iconForAction(log.action);
                    const entityLink = log.entityType === "Auction" ? `/admin/auctions/${log.entityId}` : null;
                    return (
                      <Tr key={log._id}>
                        <Td>
                          {log.actor?.name ?? "—"}
                          <span className="block text-xs text-(--color-text-faint)" dir="ltr">
                            {log.actor?.phone}
                          </span>
                        </Td>
                        <Td className="font-mono text-xs">
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-(--color-text-faint) shrink-0" aria-hidden="true" strokeWidth={2} />
                            {log.action}
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={entityTone[log.entityType] ?? "neutral"}>{log.entityType}</Badge>
                        </Td>
                        <Td className="hidden lg:table-cell font-mono text-xs text-(--color-text-faint)">
                          {entityLink ? (
                            <Link href={entityLink} className="text-(--color-gold) hover:text-(--color-gold-hover)">
                              {log.entityId.slice(-8)}
                            </Link>
                          ) : (
                            log.entityId.slice(-8)
                          )}
                        </Td>
                        <Td className="text-xs text-(--color-text-faint)">{formatDateTime(log.createdAt, locale)}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              <Pagination page={page} pages={pages} total={total} />
            </TableContainer>
          </div>
        </>
      )}
    </div>
  );
}
