"use client";

import Link from "next/link";
import { Headphones, Mail, Instagram, MessageCircle } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { AppStoreBadge, GooglePlayBadge } from "@/components/layout/StoreBadges";

const socials = [
  { key: "whatsapp", href: "https://wa.me/", icon: MessageCircle, label: "WhatsApp" },
  { key: "x", href: "https://x.com/", icon: XGlyph, label: "X" },
  { key: "instagram", href: "https://instagram.com/", icon: Instagram, label: "Instagram" },
  { key: "email", href: "mailto:support@mazad.sa", icon: Mail, label: "Email" },
] as const;

export function Footer() {
  const { t } = useTranslations();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-(--color-border) bg-(--color-bg-elevated)">
      <span
        aria-hidden="true"
        className="mz-glow-gold pointer-events-none absolute -top-40 start-1/2 h-80 w-[48rem] -translate-x-1/2 opacity-50"
      />

      <div className="mz-container relative grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <MazadLogo className="h-11 w-11" />
            <span className="text-xl font-bold tracking-tight text-(--color-text)">مزاد</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">{t("footer.tagline")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AppStoreBadge />
            <GooglePlayBadge />
          </div>
        </div>

        <nav aria-label={t("footer.quickLinks")}>
          <h3 className="mb-5 text-sm font-semibold text-(--color-text)">{t("footer.quickLinks")}</h3>
          <ul className="flex flex-col gap-3 text-sm text-(--color-text-muted)">
            {[
              { href: "/auctions", label: t("nav.auctions") },
              { href: "/auctions/exclusive", label: t("nav.exclusive") },
              { href: "/vip", label: t("nav.vip") },
              { href: "/ads", label: t("nav.ads") },
              { href: "/chat", label: t("nav.chat") },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center transition-colors hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
            <Headphones className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
            {t("footer.contact")}
          </h3>
          <p className="max-w-xs text-sm leading-relaxed text-(--color-text-muted)">{t("footer.contactHint")}</p>

          <ul className="mt-5 flex items-center gap-2.5">
            {socials.map((social) => (
              <li key={social.key}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) transition-colors hover:border-(--color-gold)/40 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-(--color-border) py-5">
        <p className="mz-container text-center text-xs text-(--color-text-faint)">
          © {new Date().getFullYear()} مزاد · Mazad — {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}

/** lucide-react has no X (Twitter) mark, and mixing in a second icon pack
 * for one glyph would break the single-library rule — so it is drawn here
 * against the same 24px grid and stroke conventions. */
function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M13.72 10.47 20.5 2.5h-1.9l-5.9 6.93L8 2.5H2.5l7.13 10.4-7.13 8.6h1.9l6.24-7.33 4.98 7.33H21l-7.4-11.03Zm-2.2 2.59-.72-1.04L5.1 3.94h2.5l4.65 6.7.72 1.04 6.05 8.72h-2.5l-4.93-7.1Z" />
    </svg>
  );
}
