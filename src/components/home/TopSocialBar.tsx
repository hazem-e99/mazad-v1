"use client";

import { Bell, MessageCircle } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { InstagramGlyph, SnapchatGlyph, TikTokGlyph, XGlyph } from "@/components/layout/SocialGlyphs";

/**
 * The charcoal strip above the hero: one line of copy on the reading side,
 * the account links on the other.
 *
 * It stays charcoal in both themes — hence `--color-charcoal` rather than
 * a surface token. The bar is chrome, not content: there is no "social
 * links" record in the database, so these are declared here rather than
 * dressed up as a query result.
 */
const SOCIALS = [
  { key: "whatsapp", href: "https://wa.me/", icon: MessageCircle, label: "WhatsApp" },
  { key: "snapchat", href: "https://snapchat.com/", icon: SnapchatGlyph, label: "Snapchat" },
  { key: "tiktok", href: "https://tiktok.com/", icon: TikTokGlyph, label: "TikTok" },
  { key: "instagram", href: "https://instagram.com/", icon: InstagramGlyph, label: "Instagram" },
  { key: "x", href: "https://x.com/", icon: XGlyph, label: "X" },
] as const;

export function TopSocialBar() {
  const { t } = useTranslations();

  return (
    <div className="relative z-30 bg-(--color-charcoal) text-(--color-on-charcoal)">
      <div className="mz-container flex h-11 items-center justify-between gap-4">
        <ul className="flex items-center gap-1">
          {SOCIALS.map((social) => (
            <li key={social.key}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm) text-(--color-on-charcoal-muted) transition-colors duration-(--duration-fast) hover:bg-white/8 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
              >
                <social.icon className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex min-w-0 items-center gap-2.5">
          <p className="truncate text-[11px] font-medium text-(--color-on-charcoal-muted) sm:text-xs">
            {t("home.followUs")}
          </p>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-gold)/15 text-(--color-gold)"
            aria-hidden="true"
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}
