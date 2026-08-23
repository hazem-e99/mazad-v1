import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { getSession, isStaffSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/siteSettingsQueries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getSession(), getSiteSettings()]);

  // Only what the navbar actually renders crosses the server/client
  // boundary — never the raw session (it carries the full permission
  // list, which the client has no use for).
  const viewer = session
    ? {
        role: session.role,
        isStaff: isStaffSession(session),
      }
    : null;

  return (
    <>
      <SplashScreen />
      <Header viewer={viewer} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
