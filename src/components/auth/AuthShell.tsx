"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Zap, Crown } from "lucide-react";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * The split layout behind login and register: the form on one side, an
 * automotive/plate panel on the other.
 *
 * The panel is composition, not decoration around the inputs — the form
 * itself stays deliberately plain, because a sign-in field that glows is
 * a sign-in field that is harder to read (§29).
 */
const SHOWCASE_PLATES = [
  { type: "private", lettersAr: "ن ه ـو", lettersEn: "NHW", numbers: "555" },
  { type: "private", lettersAr: "ص ص", lettersEn: "SSA", numbers: "7777" },
  { type: "private", lettersAr: "أ ب ج", lettersEn: "ABC", numbers: "1" },
] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t, locale } = useTranslations();

  const points = [
    { icon: ShieldCheck, label: t("home.trustSecure") },
    { icon: Zap, label: t("home.trustLive") },
    { icon: Crown, label: t("home.trustExclusive") },
  ];

  return (
    <div className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 lg:grid-cols-2">
      {/* ── Form ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-gold)"
          >
            <MazadLogo className="h-11 w-16" />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-sm text-(--color-text-muted)">{footer}</div>
        </div>
      </div>

      {/* ── Showcase ─────────────────────────────────────────────────
          Hidden below lg rather than stacked: on a phone it would push
          the form under the fold, which is the one thing the page is
          for. */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden border-s border-(--color-border) bg-(--color-bg-elevated) lg:flex lg:flex-col lg:items-center lg:justify-center"
      >
        <div className="relative flex flex-col items-center gap-8 px-10">
          <div className="flex flex-col items-center gap-5">
            {SHOWCASE_PLATES.map((plate, i) => (
              <div
                key={plate.numbers}
                style={{
                  transform: `translateX(${(i - 1) * 18}px) rotate(${(i - 1) * -2.5}deg)`,
                  opacity: i === 1 ? 1 : 0.6,
                }}
              >
                <SaudiPlate
                  type={plate.type}
                  usageType={plate.usageType}
                  shape={plate.shape}
                  classification={plate.classification}
                  lettersAr={plate.lettersAr}
                  lettersEn={plate.lettersEn}
                  numbers={plate.numbers}
                  logo={null}
                  size={i === 1 ? "lg" : "md"}
                  vip={i === 1}
                  locale={locale}
                />
              </div>
            ))}
          </div>

          <p className="max-w-sm text-center text-lg font-semibold leading-relaxed text-(--color-text)">
            {t("home.titleLine1")} <span className="text-(--color-gold)">{t("home.titleHighlight")}</span>{" "}
            {t("home.titleLine2")}
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {points.map((point) => (
              <li key={point.label} className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                <point.icon className="h-4 w-4 text-(--color-gold)" strokeWidth={1.75} />
                {point.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
