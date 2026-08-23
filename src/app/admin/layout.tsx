import { redirect } from "next/navigation";
import { getSession, isStaffSession } from "@/lib/auth";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminRealtimeProvider } from "@/components/admin/AdminRealtimeProvider";
import { AdminSessionProvider } from "@/components/admin/AdminSessionProvider";
import { effectivePermissions } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/login");

  if (!isStaffSession(session)) redirect("/");

  // One realtime subscription for the whole dashboard: every staff page
  // and every live cell inside it reads from this single connection.
  return (
    <AdminSessionProvider role={session.role} permissions={effectivePermissions(session.role, session.permissions)}>
      <AdminRealtimeProvider>
      <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
        <AdminHeader role={session.role} />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <AdminSidebar />
          <main className="min-w-0 flex-1 rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated) p-5 sm:p-7 lg:p-9">
            <div className="mx-auto w-full max-w-[1500px]">{children}</div>
          </main>
        </div>
      </div>
      </AdminRealtimeProvider>
    </AdminSessionProvider>
  );
}
