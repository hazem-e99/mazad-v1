import ar, { type MessageCatalog } from "@/locales/ar";
import en from "@/locales/en";

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "mazad_locale";

export const MESSAGES = { ar, en } satisfies Record<Locale, MessageCatalog>;

export type Messages = MessageCatalog;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ar" || value === "en";
}

export function dirForLocale(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Resolves a dotted key path (e.g. "auction.placeBid") against a message
 * catalog, falling back to the key itself if missing so a translation gap
 * degrades visibly instead of crashing. Optional `params` fill in
 * `{placeholder}` tokens in the resolved string (e.g. "page {page} of
 * {pages}"), so word order stays locale-appropriate instead of being
 * assembled from concatenated fragments.
 */
export function resolveMessage(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>
): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = messages;
  for (const part of parts) {
    if (node == null || typeof node !== "object") return key;
    node = node[part];
  }
  if (typeof node !== "string") return key;
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, paramKey) =>
    paramKey in params ? String(params[paramKey]) : match
  );
}
