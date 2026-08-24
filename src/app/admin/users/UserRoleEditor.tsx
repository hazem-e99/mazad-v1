"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";
import type { Permission, UserRole } from "@/lib/constants";

export function UserRoleEditor({
  userId,
  role: initialRole,
  permissions: initialPermissions,
  isActive: initialActive,
}: {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
}) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set(initialPermissions));
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const roleLabel: Record<UserRole, string> = {
    admin: t("admin.roleAdmin"),
    supervisor: t("admin.roleSupervisor"),
    user: t("admin.roleUser"),
  };

  const permissionLabel: Record<Permission, string> = {
    "plate:create_featured": t("admin.permCreateFeatured"),
    "auction:create": t("admin.permAuctionCreate"),
    "auction:sell": t("admin.permAuctionSell"),
    "auction:buy": t("admin.permAuctionBuy"),
    "auction:bid": t("admin.permAuctionBid"),
    "plate:manage": t("admin.permPlateManage"),
    "plate_logo:manage": t("admin.permPlateLogoManage"),
    "category:manage": t("admin.permCategoryManage"),
    "listing:moderate": t("admin.permListingModerate"),
    "ownership_document:view": t("admin.permOwnershipDocumentView"),
    "auction:manage": t("admin.permAuctionManage"),
    "user:manage": t("admin.permUserManage"),
    "vip:manage": t("admin.permVipManage"),
    "ad:manage": t("admin.permAdManage"),
    "upload:manage": t("admin.permUploadManage"),
    "stats:view": t("admin.permStatsView"),
    "audit:view": t("admin.permAuditView"),
  };

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
        body: JSON.stringify({ role, permissions: Array.from(permissions), isActive }),
      });
      push(t("admin.userUpdated"), "success");
      setOpen(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.userUpdateFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    // Focus the dialog on open, close on Escape, and keep focus trapped
    // inside it (rudimentary tab-cycle) while it's the only interactive
    // surface on screen — a background admin table shouldn't be reachable
    // by keyboard while this modal is up.
    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {t("admin.editUserButton")}
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-4 outline-none"
      >
        <h3 id={titleId} className="font-semibold text-(--color-text)">
          {t("admin.editPermissionsTitle")}
        </h3>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-(--color-text-muted)">{t("admin.colRole")}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm"
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </label>

        {role === "supervisor" && (
          <fieldset className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            <legend className="text-sm text-(--color-text-muted) mb-1">{t("admin.additionalPermissions")}</legend>
            {PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm text-(--color-text)">
                <input type="checkbox" checked={permissions.has(p)} onChange={() => togglePermission(p)} />
                {permissionLabel[p]}
              </label>
            ))}
          </fieldset>
        )}

        <label className="flex items-center gap-2 text-sm text-(--color-text)">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t("admin.accountActive")}
        </label>

        <div className="flex items-center gap-2 justify-end mt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="gold" size="sm" loading={loading} onClick={save}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
