import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/login");

  const isStaff =
    session.role === "admin" ||
    session.role === "supervisor" ||
    hasPermission(session, "stats:view");

  if (!isStaff) redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <AdminHeader role={session.role} />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 min-w-0 p-4 sm:p-8 max-w-[1600px]">{children}</div>
      </div>
    </div>
  );
}
