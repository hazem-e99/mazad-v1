/**
 * Theme identity, shared by the server (which stamps `<html data-theme>`)
 * and the client (which flips it). Everything visual lives in
 * src/app/globals.css under `:root[data-theme="…"]` — adding a theme means
 * adding a name here and a token block there, never touching components.
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** The warm ivory theme is the product's default presentation; the original
 * dark theme stays fully intact behind the switcher. */
export const DEFAULT_THEME: Theme = "light";

export const THEME_COOKIE = "mazad_theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "light" || value === "dark";
}
