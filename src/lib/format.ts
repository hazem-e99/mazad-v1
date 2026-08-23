import type { Locale } from "@/lib/i18n";
import { STATS_TIMEZONE } from "@/lib/constants";

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

// Weekday rather than a day/month number: the stats charts span a single
// week, so "السبت" identifies a bar unambiguously, and it sidesteps the
// Hijri/Gregorian calendar question that numeric ar-SA dates raise.
const weekdayFormatters: Record<Locale, Intl.DateTimeFormat> = {
  ar: new Intl.DateTimeFormat("ar-SA", { weekday: "short", timeZone: STATS_TIMEZONE }),
  en: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: STATS_TIMEZONE }),
};

/** Formats a `YYYY-MM-DD` day key (see STATS_TIMEZONE) as a short weekday. */
export function formatWeekday(dayKey: string, locale: Locale = "ar"): string {
  return weekdayFormatters[locale].format(new Date(`${dayKey}T12:00:00Z`));
}
