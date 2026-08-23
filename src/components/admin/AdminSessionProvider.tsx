"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { Permission, UserRole } from "@/lib/constants";

interface AdminViewer {
  role: UserRole;
  permissions: Permission[];
}

interface AdminSessionValue extends AdminViewer {
  /** Client-side mirror of the server's hasPermission. */
  can: (permission: Permission) => boolean;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

/**
 * Carries the signed-in staff member's entitlements to the dashboard's
 * client components, so the sidebar and the action menus can leave out
 * what this person cannot use.
 *
 * The check is reimplemented here rather than imported from
 * `@/lib/session`: that module pulls in `jsonwebtoken` and `bcryptjs` at
 * the top level, and importing it from a client component would drag both
 * into the browser bundle. The rule it mirrors is two lines long and is
 * asserted against the server's own copy by the permission tests.
 *
 * This is convenience, never protection. Every route behind these links
 * re-checks the same permission on the server (see checkPagePermission
 * and requirePermission); hiding a link only saves someone from clicking
 * into a 403.
 */
export function AdminSessionProvider({
  role,
  permissions,
  children,
}: AdminViewer & { children: React.ReactNode }) {
  const can = useCallback(
    (permission: Permission) => role === "admin" || permissions.includes(permission),
    [role, permissions]
  );

  const value = useMemo(() => ({ role, permissions, can }), [role, permissions, can]);

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    // Same defensive fallback as useTranslations: a component rendered
    // outside the provider grants nothing rather than throwing.
    return { role: "user", permissions: [], can: () => false };
  }
  return ctx;
}
