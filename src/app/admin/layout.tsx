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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,189,51,0.13),_transparent_26%),_linear-gradient(180deg,#070c13_0%,#0a1118_100%)] text-(--color-text)">
      <AdminHeader role={session.role} />
      <div className="mx-auto flex w-full max-w-[1680px] flex-1 gap-5 px-3 pb-6 pt-4 sm:px-5 lg:px-6">
        <AdminSidebar />
        <main className="min-w-0 flex-1 rounded-[1.5rem] border border-(--color-border) bg-(--color-bg-elevated)/90 p-4 shadow-(--shadow-elevated) backdrop-blur-sm sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
