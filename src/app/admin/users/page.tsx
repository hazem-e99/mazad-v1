import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { TableContainer, Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { getServerTranslator } from "@/lib/i18n-server";
import { USER_ROLES } from "@/lib/constants";
import { toUserDTOList, type LeanUser } from "@/lib/dto";
import { UserRoleEditor } from "./UserRoleEditor";

export const revalidate = 0;

const roleTone = { admin: "gold", supervisor: "scheduled", user: "neutral" } as const;

interface Props {
  searchParams: Promise<{ search?: string; role?: string; isActive?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();
  const { t } = await getServerTranslator();

  const roleLabel = { admin: t("admin.roleAdmin"), supervisor: t("admin.roleSupervisor"), user: t("admin.roleUser") } as const;

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 25;
  const filter: Record<string, unknown> = {};
  if (params.role) filter.role = params.role;
  if (params.isActive === "true") filter.isActive = true;
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
            key: "isActive",
            label: t("common.status"),
            options: [
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.suspended") },
            ],
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState title={t("admin.noMatchingUsers")} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {users.map((u) => (
              <Card key={u._id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-(--color-text)">{u.name}</p>
                    <p className="tnum text-xs text-(--color-text-faint)" dir="ltr">
                      {u.phone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={roleTone[u.role as keyof typeof roleTone]}>{roleLabel[u.role as keyof typeof roleLabel]}</Badge>
                    {u.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}
                  </div>
                </div>
                <div className="pt-1">
                  <UserRoleEditor userId={u._id} role={u.role} permissions={u.permissions ?? []} isActive={u.isActive} />
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
                    <Th>{t("admin.colRole")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th>{t("admin.colManage")}</Th>
                  </Tr>
                </Thead>
                <tbody>
                  {users.map((u) => (
                    <Tr key={u._id}>
                      <Td>{u.name}</Td>
                      <Td className="tnum" dir="ltr">
                        {u.phone}
                      </Td>
                      <Td>
                        <Badge tone={roleTone[u.role as keyof typeof roleTone]}>{roleLabel[u.role as keyof typeof roleLabel]}</Badge>
                      </Td>
                      <Td>{u.isActive ? <Badge tone="sold">{t("common.active")}</Badge> : <Badge tone="neutral">{t("common.suspended")}</Badge>}</Td>
                      <Td>
                        <UserRoleEditor
                          userId={u._id}
                          role={u.role}
                          permissions={u.permissions ?? []}
                          isActive={u.isActive}
                        />
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
