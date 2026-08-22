import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSession, hasPermission } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Only what the navbar actually renders crosses the server/client
  // boundary — never the raw session (it carries the full permission
  // list, which the client has no use for).
  const viewer = session
    ? {
        role: session.role,
        isStaff:
          session.role === "admin" || session.role === "supervisor" || hasPermission(session, "stats:view"),
      }
    : null;

  return (
    <>
      <Header viewer={viewer} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
