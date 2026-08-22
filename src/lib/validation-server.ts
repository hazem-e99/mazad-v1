import { getServerLocale } from "@/lib/i18n-server";
import { schemasForLocale, type Schemas } from "@/lib/validation";

/**
 * Schemas bound to the current request's locale, so a validation failure
 * comes back in the language the submitting page was rendered in.
 *
 * Deliberately separate from validation.ts: that module is imported by
 * client components too, and anything reachable from it must not touch
 * next/headers.
 */
export async function getLocalizedSchemas(): Promise<Schemas> {
  return schemasForLocale(await getServerLocale());
}
