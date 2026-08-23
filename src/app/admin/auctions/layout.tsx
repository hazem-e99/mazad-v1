import { redirect } from "next/navigation";
import { getSession, hasAnyPermission } from "@/lib/auth";
import { AccessDenied } from "@/components/admin/AccessDenied";

/**
 * Permission gate for /admin/auctions.
 *
 * Two entitlements reach this section and they are not the same job:
 * `auction:create` opens the builder at /auctions/new, `auction:manage`
 * opens the list and the detail screens. Holding either is enough to be
 * *in* the section; the narrower gates then sit on the routes themselves
 * (auctions/new/layout.tsx for the builder, the list and detail pages for
 * management), so someone who may only create cannot reach the management
 * screens by URL, or the reverse.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasAnyPermission(session, ["auction:manage", "auction:create"])) return <AccessDenied />;

  return <>{children}</>;
}
