"use client";

import { ShieldCheck, Zap, Crown, Clock4, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * One strip, four claims, thin rules between them — not four cards. The
 * distinction matters: cards would imply four separate things to act on,
 * where this is a single statement about the platform.
 *
 * The rules come from a 1px grid gap over a border-coloured backing, so
 * they land correctly in all three layouts (4-up, 2×2, stacked) and in
 * both writing directions without a single side-specific class.
 */
export function TrustBar() {
  const { t } = useTranslations();

  const items: { icon: LucideIcon; title: string; description: string }[] = [
    { icon: ShieldCheck, title: t("home.trustSecure"), description: t("home.trustSecureHint") },
    { icon: Zap, title: t("home.trustLive"), description: t("home.trustLiveHint") },
    { icon: Crown, title: t("home.trustExclusive"), description: t("home.trustExclusiveHint") },
    { icon: Clock4, title: t("home.trustSupport"), description: t("home.trustSupportHint") },
  ];

  return (
    <section aria-label={t("home.trustLabel")}>
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-border) sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="group flex items-center gap-4 bg-(--color-bg-elevated) p-5 sm:p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-gold)/20 bg-(--color-gold-tint) text-(--color-gold) transition-colors duration-(--duration-base) group-hover:border-(--color-gold)/45">
              <item.icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-(--color-text)">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-(--color-text-muted)">
                {item.description}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
