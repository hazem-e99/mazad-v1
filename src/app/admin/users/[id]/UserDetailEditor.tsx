"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { USER_STATUSES, userStatusLabel } from "@/lib/constants";
import type { Permission, UserRole, UserStatus } from "@/lib/constants";

const CORE_PERMISSIONS: { key: Permission; labelKey: string }[] = [
  { key: "auction:buy", labelKey: "admin.canBuyLabel" },
  { key: "auction:sell", labelKey: "admin.canSellLabel" },
  { key: "auction:bid", labelKey: "admin.canBidLabel" },
  { key: "auction:create", labelKey: "admin.canCreateAuctionLabel" },
  { key: "auction:close_own", labelKey: "admin.canCloseOwnAuctionLabel" },
];

interface Props {
  userId: string;
  role: UserRole;
  name: string;
  email: string | null;
  status: UserStatus;
  permissions: Permission[];
}

/**
 * The focused editor this page is for: account info (name/email), status,
 * and the four buy/sell/bid/create-auction toggles called out explicitly
 * in the spec — distinct from UserRoleEditor's broader role +
 * supervisor-only 16-permission checklist, which stays reachable from the
 * users table for that separate concern.
 */
export function UserDetailEditor({ userId, role, name: initialName, email: initialEmail, status: initialStatus, permissions: initialPermissions }: Props) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<UserStatus>(initialStatus);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set(initialPermissions));
  const [loading, setLoading] = useState(false);

  // An admin role bypasses individual permission checks entirely (see
  // hasPermission()) — toggling these for an admin account would look
  // actionable but change nothing, so the section is informational only.
  const permissionsEditable = role !== "admin";

  function togglePermission(p: Permission) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function save() {
    setLoading(true);
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, email, status, permissions: Array.from(permissions) }),
      });
      push(t("admin.userUpdated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.userUpdateFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-(--color-text)">{t("admin.editUserButton")}</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t("admin.fieldUserName")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          <Input label={t("admin.fieldUserEmail")} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <Select label={t("admin.fieldUserStatus")} value={status} onChange={(e) => setStatus(e.target.value as UserStatus)}>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {userStatusLabel(s, locale)}
            </option>
          ))}
        </Select>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-(--color-text)">{t("admin.corePermissionsHeader")}</h3>
          {!permissionsEditable && (
            <p className="mb-2 text-xs text-(--color-text-faint)">{t("admin.adminHasAllPermissionsNote")}</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CORE_PERMISSIONS.map((perm) => (
              <Checkbox
                key={perm.key}
                label={t(perm.labelKey)}
                checked={permissionsEditable ? permissions.has(perm.key) : true}
                disabled={!permissionsEditable}
                onChange={() => togglePermission(perm.key)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="gold" size="md" loading={loading} onClick={save}>
            {t("common.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
