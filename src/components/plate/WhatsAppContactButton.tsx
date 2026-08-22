"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface WhatsAppContactButtonProps {
  contactPhone: string | null;
  message: string;
}

/** Renders nothing if the phone number can't be normalized to a valid
 * Saudi WhatsApp number — never a broken/dead button. */
export function WhatsAppContactButton({ contactPhone, message }: WhatsAppContactButtonProps) {
  const { t } = useTranslations();
  if (!contactPhone) return null;

  const url = buildWhatsAppUrl(contactPhone, message);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-(--radius-md) bg-[#25D366] text-white font-semibold text-base hover:brightness-105 transition-colors w-full sm:w-auto"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {t("pages.contactViaWhatsApp")}
    </a>
  );
}
