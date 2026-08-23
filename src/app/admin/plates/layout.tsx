import { checkPagePermission } from "@/lib/auth";
import { AccessDenied } from "@/components/admin/AccessDenied";

/**
 * Permission gate for everything under /admin/plates.
 *
 * A layout rather than a call inside each page: it runs before the page,
 * it covers nested routes automatically, and it is the only way to guard
 * the client-component pages in this subtree, which cannot await a server
 * check themselves. The admin layout above proves the visitor is staff —
 * this proves they hold the entitlement this section is built on, and the
 * page's own queries never run without it.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await checkPagePermission("plate:manage");
  if (!session) return <AccessDenied />;

  return <>{children}</>;
}
