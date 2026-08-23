"use client";

import Link from "next/link";
import { Link as LinkIcon, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { InstagramGlyph, SnapchatGlyph, TikTokGlyph, XGlyph } from "@/components/layout/SocialGlyphs";
import { localizedText, type SiteSettingsDTO, type SiteSocialLink } from "@/lib/siteSettings";

export function Footer({ settings }: { settings: SiteSettingsDTO }) {
  const { locale } = useTranslations();
  const sections = settings.footer.sections.filter((section) => section.enabled);
  const socials = settings.footer.socials.filter((social) => social.enabled);

  return (
    <footer className="relative mt-14 overflow-hidden border-t border-(--color-border) bg-(--color-bg-elevated)">
      <div className="mz-container relative grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <MazadLogo src={settings.brand.footerLogoUrl || settings.brand.logoUrl} className="h-11 w-16" />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
            {localizedText(locale, settings.footer.taglineAr, settings.footer.taglineEn)}
          </p>

          {socials.length > 0 && (
            <ul className="mt-5 flex items-center gap-2.5">
              {socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                  >
                    <SocialIcon platform={social.platform} className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sections.map((section) => (
          <nav key={section.id} aria-label={localizedText(locale, section.titleAr, section.titleEn)}>
            <h3 className="mb-5 text-sm font-semibold text-(--color-text)">
              {localizedText(locale, section.titleAr, section.titleEn)}
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-(--color-text-muted)">
              {section.links
                .filter((link) => link.enabled)
                .map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                    >
                      {localizedText(locale, link.labelAr, link.labelEn)}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="relative border-t border-(--color-border) py-5">
        <p className="mz-container text-center text-xs text-(--color-text-faint)">
          (c) {new Date().getFullYear()} Mazad - {localizedText(locale, settings.footer.copyrightAr, settings.footer.copyrightEn)}
        </p>
      </div>
    </footer>
  );
}

function SocialIcon({ platform, className }: { platform: SiteSocialLink["platform"]; className: string }) {
  if (platform === "whatsapp") return <MessageCircle className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "instagram") return <InstagramGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "snapchat") return <SnapchatGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "tiktok") return <TikTokGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "x") return <XGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "email") return <Mail className={className} aria-hidden="true" strokeWidth={1.75} />;
  return <LinkIcon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
