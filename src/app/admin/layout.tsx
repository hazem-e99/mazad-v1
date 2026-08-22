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
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <AdminHeader role={session.role} />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <AdminSidebar />
        <main className="min-w-0 flex-1 rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated) p-5 sm:p-7 lg:p-9">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
