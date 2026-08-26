"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Mail,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { SocialIcon } from "@/components/layout/SocialGlyphs";
import { localizedText, type SiteSettingsDTO } from "@/lib/siteSettings";

/**
 * The footer: a full-bleed dark band under a gold hairline. It runs the
 * whole viewport width; only the columns inside keep the page measure.
 *
 * The artwork — Diriyah on one side, the Riyadh skyline on the other,
 * fading into brown in the middle — is a photograph, so the columns sit
 * over a scrim rather than directly on it. That middle band is where the
 * copy lands, which is why the scrim is heaviest there.
 *
 * The panel stays dark in both themes: it takes `--color-charcoal` and
 * `--color-on-charcoal`, the theme-independent pair, instead of the
 * surface tokens that flip with the switcher.
 */

/** Quick links. Every href is a real route under src/app — the footer
 * advertises nothing the site cannot open. */
const QUICK_LINKS: { href: string; labelKey: string }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/auctions", labelKey: "nav.auctions" },
  { href: "/auctions/exclusive", labelKey: "nav.exclusive" },
  { href: "/vip", labelKey: "nav.vip" },
  { href: "/listings", labelKey: "nav.marketplace" },
  { href: "/ads", labelKey: "nav.ads" },
  { href: "/chat", labelKey: "nav.chat" },
];

export function Footer({ settings }: { settings: SiteSettingsDTO }) {
  const { t, locale } = useTranslations();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  // The same list the header renders, so the two can never advertise
  // different accounts.
  const socials = settings.footer.socials
    .filter((social) => social.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // An admin who clears a field gets the catalog copy back rather than a
  // blank line.
  const tagline = localizedText(locale, settings.footer.taglineAr, settings.footer.taglineEn) || t("footer.tagline");
  const copyright = localizedText(locale, settings.footer.copyrightAr, settings.footer.copyrightEn) || t("footer.rights");

  const phone = settings.contact?.phone || t("footer.phone");
  const email = settings.contact?.email || t("footer.email");
  const address = localizedText(locale, settings.contact?.addressAr, settings.contact?.addressEn) || t("footer.address");
  const hours = localizedText(locale, settings.contact?.workingHoursAr, settings.contact?.workingHoursEn) || t("footer.hours");

  const contactItems: { icon: LucideIcon; value: string; href?: (value: string) => string }[] = [
    { icon: Headphones, value: phone, href: (v) => `tel:${v.replace(/\s+/g, "")}` },
    { icon: Mail, value: email, href: (v) => `mailto:${v}` },
    { icon: MapPin, value: address },
    { icon: Clock, value: hours },
  ];

  return (
    <footer className="relative isolate mt-16 overflow-hidden border-t border-(--color-gold)/35 text-(--color-on-charcoal)">
      <div>
        <Image
          src="/images/bg-footer.png"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Darkest through the middle, where the three columns sit; the
            skyline at either end stays readable. */}
        <span
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(24,20,16,0.62)_0%,rgba(24,20,16,0.9)_28%,rgba(24,20,16,0.92)_72%,rgba(24,20,16,0.62)_100%)]"
          aria-hidden="true"
        />

        <div className="mz-container grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.15fr_0.85fr_1.15fr] lg:gap-0">
          {/* ── Brand ─────────────────────────────────────────────────── */}
          <div className="lg:px-10 lg:first:ps-0">
            <MazadLogo src={settings.brand.footerLogoUrl || settings.brand.logoUrl} className="h-20 w-[7rem]" />
            <p className="mt-4 max-w-xs text-sm leading-7 text-(--color-on-charcoal-muted)">{tagline}</p>
          </div>

          {/* ── Quick links ───────────────────────────────────────────── */}
          <nav aria-label={t("footer.quickLinks")} className="lg:border-s lg:border-white/12 lg:px-10">
            <FooterHeading>{t("footer.quickLinks")}</FooterHeading>
            <ul className="mt-6 flex flex-col gap-3.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-(--color-on-charcoal-muted) transition-colors duration-(--duration-fast) hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                  >
                    <Chevron
                      className="h-3.5 w-3.5 shrink-0 text-(--color-gold)/70 transition-transform duration-(--duration-fast) group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
                      aria-hidden="true"
                      strokeWidth={2.4}
                    />
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Contact ───────────────────────────────────────────────── */}
          <div className="lg:border-s lg:border-white/12 lg:px-10 lg:last:pe-0">
            <FooterHeading>{t("footer.contact")}</FooterHeading>
            <p className="mt-6 max-w-xs text-sm leading-7 text-(--color-on-charcoal-muted)">
              {t("footer.contactHint")}
            </p>

            <ul className="mt-6 flex flex-col gap-3.5">
              {contactItems.map((row, idx) => {
                const value = row.value;
                const body = (
                  <>
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--color-gold)/40 text-(--color-gold)"
                      aria-hidden="true"
                    >
                      <row.icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 text-sm text-(--color-on-charcoal-muted)" dir="auto" style={{ unicodeBidi: "isolate" }}>
                      {value}
                    </span>
                  </>
                );

                return (
                  <li key={idx}>
                    {row.href ? (
                      <a
                        href={row.href(value)}
                        // Phone numbers and addresses read left-to-right
                        // even in Arabic copy; isolating them keeps the
                        // digits from reordering around the surrounding text.
                        className="flex items-center gap-3 transition-colors duration-(--duration-fast) hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {socials.length > 0 && (
              <ul className="mt-7 flex items-center gap-2.5" aria-label={t("footer.socialsLabel")}>
                {socials.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-(--color-on-charcoal-muted) transition-colors duration-(--duration-fast) hover:border-(--color-gold)/60 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
                    >
                      <SocialIcon platform={social.platform} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Legal bar ───────────────────────────────────────────────── */}
        <div className="border-t border-white/12">
          <div className="mz-container flex flex-col-reverse items-center justify-between gap-4 py-5 lg:flex-row">
          <LanguageSwitcher variant="onDark" className="h-11 px-5" />

          <p className="flex items-center gap-2 text-center text-xs text-(--color-on-charcoal-muted)">
            <ShieldCheck className="h-4 w-4 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.9} />
            <span>
              {copyright} © {new Date().getFullYear()} لوحتي
            </span>
          </p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2.5 text-xs font-medium text-(--color-on-charcoal-muted) transition-colors duration-(--duration-fast) hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
              <ArrowUp className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
            </span>
            {t("footer.backToTop")}
          </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** A column heading with the short gold rule under it. */
function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="relative pb-3 text-lg font-bold text-(--color-gold)">
      {children}
      <span
        className="absolute bottom-0 start-0 h-px w-10 bg-(--color-gold)/70"
        aria-hidden="true"
      />
    </h3>
  );
}
