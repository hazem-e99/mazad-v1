import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { USER_ROLES, USER_STATUSES, userStatusLabel } from "@/lib/constants";
import type { UserStatus } from "@/lib/constants";
import { toUserDTOList, type LeanUser } from "@/lib/dto";
import { UserRoleEditor } from "./UserRoleEditor";
import { UserQuickActions } from "./UserQuickActions";

export const revalidate = 0;

const roleTone = { admin: "gold", supervisor: "scheduled", user: "neutral" } as const;
const statusTone: Record<UserStatus, "sold" | "neutral" | "unsold"> = {
  active: "sold",
  suspended: "neutral",
  disabled: "unsold",
};

/** Small on/off marker for a permission column — a badge rather than a raw
 * checkmark so it reads clearly in a dense table row. */
function PermBadge({ on }: { on: boolean }) {
  return <Badge tone={on ? "sold" : "neutral"}>{on ? "✓" : "—"}</Badge>;
}

interface Props {
  searchParams: Promise<{ search?: string; role?: string; status?: string; isActive?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const roleLabel = { admin: t("admin.roleAdmin"), supervisor: t("admin.roleSupervisor"), user: t("admin.roleUser") } as const;

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (params.role) filter.role = params.role;
  if (params.status) filter.status = params.status;
  else if (params.isActive === "true") filter.isActive = true;
  else if (params.isActive === "false") filter.isActive = false;
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { phone: { $regex: params.search, $options: "i" } },
    ];
  }

  const [userDocs, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanUser[]>(),
    User.countDocuments(filter),
  ]);
  const users = toUserDTOList(userDocs);
  const pages = Math.max(1, Math.ceil(total / limit));
  const has = (u: (typeof users)[number], perm: "auction:buy" | "auction:sell" | "auction:bid" | "auction:create") =>
    u.role === "admin" || u.permissions.includes(perm);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.usersTitle")}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("admin.usersSubtitle")}</p>
      </div>

      <FilterBar
        searchPlaceholder={t("admin.searchUsersPlaceholder")}
        selects={[
          { key: "role", label: t("admin.filterRole"), options: USER_ROLES.map((r) => ({ value: r, label: roleLabel[r] })) },
          {
            key: "status",
            label: t("admin.filterStatus"),
            options: USER_STATUSES.map((s) => ({ value: s, label: userStatusLabel(s, locale) })),
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState title={t("admin.noMatchingUsers")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {users.map((u) => (
              <Card key={u._id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/admin/users/${u._id}`} className="font-semibold text-(--color-text) hover:text-(--color-gold)">
                      {u.name}
                    </Link>
                    <p className="tnum text-xs text-(--color-text-faint)" dir="ltr">
                      {u.email || u.phone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={roleTone[u.role as keyof typeof roleTone]}>{roleLabel[u.role as keyof typeof roleLabel]}</Badge>
                    <Badge tone={statusTone[u.status]}>{userStatusLabel(u.status, locale)}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-(--color-text-muted)">
                  <span>{t("admin.colCanBuy")}: <PermBadge on={has(u, "auction:buy")} /></span>
                  <span>{t("admin.colCanSell")}: <PermBadge on={has(u, "auction:sell")} /></span>
                  <span>{t("admin.colCanBid")}: <PermBadge on={has(u, "auction:bid")} /></span>
                  <span>{t("admin.colCanCreateAuction")}: <PermBadge on={has(u, "auction:create")} /></span>
                </div>
                <p className="text-xs text-(--color-text-faint)">{formatDateTime(u.createdAt, locale)}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link href={`/admin/users/${u._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover)">
                    {t("pages.viewDetails")}
                  </Link>
                  <UserRoleEditor userId={u._id} role={u.role} permissions={u.permissions ?? []} isActive={u.isActive} />
                  <UserQuickActions userId={u._id} status={u.status} />
                </div>
              </Card>
            ))}
            <Card>
              <Pagination page={page} pages={pages} total={total} />
            </Card>
          </div>

          <div className="hidden sm:block">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("admin.colName")}</Th>
                    <Th>{t("admin.colPhone")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th>{t("admin.colCanBuy")}</Th>
                    <Th>{t("admin.colCanSell")}</Th>
                    <Th>{t("admin.colCanBid")}</Th>
                    <Th>{t("admin.colCanCreateAuction")}</Th>
                    <Th>{t("admin.colRegisteredAt")}</Th>
                    <Th>{t("admin.colManage")}</Th>
                  </Tr>
                </Thead>
                <tbody>
                  {users.map((u) => (
                    <Tr key={u._id}>
                      <Td>
                        <Link href={`/admin/users/${u._id}`} className="font-medium text-(--color-text) hover:text-(--color-gold)">
                          {u.name}
                        </Link>
                        <div className="mt-0.5">
                          <Badge tone={roleTone[u.role as keyof typeof roleTone]}>{roleLabel[u.role as keyof typeof roleLabel]}</Badge>
                        </div>
                      </Td>
                      <Td className="tnum" dir="ltr">
                        {u.email || u.phone}
                      </Td>
                      <Td>
                        <Badge tone={statusTone[u.status]}>{userStatusLabel(u.status, locale)}</Badge>
                      </Td>
                      <Td><PermBadge on={has(u, "auction:buy")} /></Td>
                      <Td><PermBadge on={has(u, "auction:sell")} /></Td>
                      <Td><PermBadge on={has(u, "auction:bid")} /></Td>
                      <Td><PermBadge on={has(u, "auction:create")} /></Td>
                      <Td>{formatDateTime(u.createdAt, locale)}</Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/users/${u._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover)">
                            {t("pages.viewDetails")}
                          </Link>
                          <UserRoleEditor
                            userId={u._id}
                            role={u.role}
                            permissions={u.permissions ?? []}
                            isActive={u.isActive}
                          />
                          <UserQuickActions userId={u._id} status={u.status} />
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
    </div>
  );
}
