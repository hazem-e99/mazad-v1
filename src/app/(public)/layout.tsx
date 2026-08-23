import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SplashScreen, SPLASH_SEEN_COOKIE } from "@/components/layout/SplashScreen";
import { getSession, isStaffSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/siteSettingsQueries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, settings, cookieStore] = await Promise.all([getSession(), getSiteSettings(), cookies()]);
  const alreadySeenSplash = cookieStore.get(SPLASH_SEEN_COOKIE)?.value === "1";

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
      <SplashScreen alreadySeen={alreadySeenSplash} />
      <Header viewer={viewer} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <BottomNav />
    </>
  );
}
