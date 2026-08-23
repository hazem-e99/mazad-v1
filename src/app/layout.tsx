import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getServerLocale } from "@/lib/i18n-server";
import { getServerTheme } from "@/lib/theme-server";
import { dirForLocale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/siteSettingsQueries";
import { localizedText } from "@/lib/siteSettings";
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
  preload: false,
});

function splitKeywords(value: string): string[] {
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function urlOrUndefined(value: string): URL | undefined {
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function getFallbackSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://mazad-v1.onrender.com";
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([getServerLocale(), getSiteSettings()]);
  const siteName = localizedText(locale, settings.seo.siteNameAr, settings.seo.siteNameEn);
  const title = localizedText(locale, settings.seo.titleAr, settings.seo.titleEn);
  const description = localizedText(locale, settings.seo.descriptionAr, settings.seo.descriptionEn);
  const siteUrl = settings.seo.canonicalUrl || getFallbackSiteUrl();
  const metadataBase = urlOrUndefined(siteUrl);

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: splitKeywords(localizedText(locale, settings.seo.keywordsAr, settings.seo.keywordsEn)),
    alternates: metadataBase ? { canonical: metadataBase.toString() } : undefined,
    robots: {
      index: settings.seo.robotsIndex,
      follow: settings.seo.robotsFollow,
    },
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: metadataBase?.toString(),
      images: settings.seo.ogImage ? [{ url: settings.seo.ogImage, alt: title }] : undefined,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.seo.ogImage ? [settings.seo.ogImage] : undefined,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getServerLocale(), getServerTheme()]);

  return (
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
