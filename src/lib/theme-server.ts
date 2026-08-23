import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

/**
 * Resolves the active theme for a server render. Reading it here (rather
 * than from a `useEffect` on the client) is what keeps the first paint free
 * of a light/dark flash.
 */
export async function getServerTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
