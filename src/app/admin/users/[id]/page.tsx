import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getServerTranslator } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/format";
import { userStatusLabel } from "@/lib/constants";
import type { UserStatus } from "@/lib/constants";
import { toUserDTO, type LeanUser } from "@/lib/dto";
import { UserDetailEditor } from "./UserDetailEditor";
import { UserQuickActions } from "../UserQuickActions";

export const revalidate = 0;

const statusTone: Record<UserStatus, "sold" | "neutral" | "unsold"> = {
  active: "sold",
  suspended: "neutral",
  disabled: "unsold",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const { t, locale } = await getServerTranslator();

  const doc = await User.findOne({ _id: id, deletedAt: null })
    .select("-passwordHash")
    .lean<LeanUser>();
  if (!doc) notFound();

  const user = toUserDTO(doc);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const roleLabel = { admin: t("admin.roleAdmin"), supervisor: t("admin.roleSupervisor"), user: t("admin.roleUser") } as const;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/users"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-gold)"
        >
          <Back className="h-4 w-4" aria-hidden="true" />
          {t("admin.backToUsers")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-(--color-text)">{t("admin.userDetailTitle")}</h1>
            <p className="mt-1 text-sm text-(--color-text-muted)">{t("admin.userDetailSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{roleLabel[user.role]}</Badge>
            <Badge tone={statusTone[user.status]}>{userStatusLabel(user.status, locale)}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-(--color-text)">{t("admin.colName")}</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-2 text-sm">
          <p className="text-(--color-text)">{user.name}</p>
          <p className="tnum text-(--color-text-muted)" dir="ltr">{user.phone}</p>
          {user.email && <p className="tnum text-(--color-text-muted)" dir="ltr">{user.email}</p>}
          <p className="text-xs text-(--color-text-faint)">
            {t("admin.colRegisteredAt")}: {formatDateTime(user.createdAt, locale)}
          </p>
        </CardBody>
      </Card>

      <UserDetailEditor
        userId={user._id}
        role={user.role}
        name={user.name}
        email={user.email}
        status={user.status}
        permissions={user.permissions}
      />

      <Card>
        <CardBody className="flex justify-end">
          <UserQuickActions userId={user._id} status={user.status} />
        </CardBody>
      </Card>
    </div>
  );
}
