import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getServerLocale } from "@/lib/i18n-server";
import { getServerTheme } from "@/lib/theme-server";
import { dirForLocale } from "@/lib/i18n";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only used for plate glyphs / tabular data below the fold, never in the
  // initial paint — eager root-level preload of this font on every route
  // triggers Chrome's "preloaded but not used within a few seconds" warning.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "مزاد - سوق لوحات السيارات السعودية",
    template: "%s | مزاد",
  },
  description: "منصة مزادات لوحات السيارات المميزة في المملكة العربية السعودية",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getServerLocale(), getServerTheme()]);

  return (
    // `data-theme` is resolved server-side so the very first paint is already
    // in the visitor's theme — see src/app/globals.css for the token blocks.
    // `body` takes its canvas from --page-background (a gradient on light),
    // which a `bg-*` utility could not express.
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      data-theme={theme}
      className={`${ibmPlexArabic.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-(--color-text)">
        <ThemeProvider initialTheme={theme}>
          <LocaleProvider initialLocale={locale}>
            {children}
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
