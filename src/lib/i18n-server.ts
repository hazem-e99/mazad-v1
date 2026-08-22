import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, MESSAGES, isLocale, resolveMessage, type Locale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerTranslator() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (key: string, params?: Record<string, string | number>) => resolveMessage(MESSAGES[locale], key, params),
  };
}
