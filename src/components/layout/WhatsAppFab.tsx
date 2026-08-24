"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { SiteSocialLink } from "@/lib/siteSettings";

/**
 * Site-wide floating WhatsApp contact, sourced from the admin-editable
 * "whatsapp" entry in site settings' footer.socials — never a hardcoded
 * number. Renders nothing until an admin has actually set a real link
 * (the seeded default is the bare "https://wa.me/" placeholder with no
 * number), matching WhatsAppContactButton's "never a dead button" rule.
 */
export function WhatsAppFab({ social }: { social: SiteSocialLink | undefined }) {
  const { t } = useTranslations();

  if (!social || !social.enabled) return null;
  if (!/^https:\/\/wa\.me\/\d/.test(social.href.trim())) return null;

  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("nav.whatsappFab")}
      title={t("nav.whatsappFab")}
      className="fixed end-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom)+1rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_-8px_rgba(37,211,102,0.65)] transition-transform duration-(--duration-fast) hover:scale-105 active:scale-95 lg:bottom-6"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" strokeWidth={2} />
    </a>
  );
}
