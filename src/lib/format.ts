import type { Locale } from "@/lib/i18n";

const numberFormatters: Record<Locale, Intl.NumberFormat> = {
  ar: new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
};

const currencySuffix: Record<Locale, string> = {
  ar: "ريال",
  en: "SAR",
};

export function formatSar(amount: number, locale: Locale = "ar"): string {
  return `${numberFormatters[locale].format(amount)} ${currencySuffix[locale]}`;
}

export function formatNumber(amount: number, locale: Locale = "ar"): string {
  return numberFormatters[locale].format(amount);
}

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  ar: new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }),
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }),
};

export function formatDateTime(iso: string | Date, locale: Locale = "ar"): string {
  return dateFormatters[locale].format(new Date(iso));
}
