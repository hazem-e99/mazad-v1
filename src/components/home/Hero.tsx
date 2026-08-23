"use client";

import Image from "next/image";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { HeroChrome } from "@/components/home/HeroChrome";
import { HeroSearch } from "@/components/home/HeroSearch";
import type { HeaderViewer } from "@/lib/navItems";

/**
 * The stage. One full-bleed photograph, the mark and the tagline centred
 * over it, and the search field sitting at the foot of the frame rather
 * than in a band of its own.
 *
 * The scrim (`.mz-stage-scrim`) does the work that makes this readable:
 * it darkens the top edge behind the floating controls, tints the
 * photograph toward the ivory palette so the stage belongs to the light
 * theme, and fades the bottom into the page canvas — which is why the
 * featured panel below can overlap it without a visible seam.
 */
export function Hero({ viewer }: { viewer: HeaderViewer | null }) {
  const { t } = useTranslations();

  return (
    <section className="mz-stage flex min-h-[clamp(30rem,72vh,44rem)] flex-col" aria-labelledby="hero-title">
      <Image
        src="/images/bg-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="mz-stage-media"
      />
      <span className="mz-stage-scrim" aria-hidden="true" />

      <HeroChrome viewer={viewer} />

      <div className="mz-container relative z-10 flex flex-1 flex-col items-center justify-center gap-8 py-20 text-center sm:gap-10 sm:py-24">
        <div className="flex flex-col items-center gap-4">
          <MazadLogo className="h-20 w-20 rounded-(--radius-lg) sm:h-24 sm:w-24" />
          <h1
            id="hero-title"
            className="text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-tight tracking-tight text-(--color-text)"
          >
            {t("home.brandTagline")}
          </h1>
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}
