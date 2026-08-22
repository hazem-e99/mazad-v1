"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, MESSAGES, resolveMessage, type Locale } from "@/lib/i18n";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      router.refresh();
    },
    [router]
  );

  const t = useCallback<TranslateFn>(
    (key, params) => resolveMessage(MESSAGES[locale], key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslations(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Fall back to the default locale for components rendered outside the
    // provider (shouldn't normally happen since it wraps the root layout).
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key, params) => resolveMessage(MESSAGES[DEFAULT_LOCALE], key, params),
    };
  }
  return ctx;
}

export function useLocale() {
  return useTranslations().locale;
}
