import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeaderVipStrip } from "@/components/layout/HeaderVipStrip";
import { getVipPlates } from "@/lib/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const vipPlates = await getVipPlates(10).catch(() => []);

  return (
    <>
      <HeaderVipStrip plates={vipPlates} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
