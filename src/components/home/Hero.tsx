"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { HeroSearch } from "@/components/home/HeroSearch";
import { DEFAULT_SITE_SETTINGS, localizedText, type SiteSettingsDTO } from "@/lib/siteSettings";

/**
 * The stage. One full-bleed photograph with the mark and the tagline
 * centred over it — nothing else competes for the frame.
 *
 * The scrim (`.mz-stage-scrim`) does the work that makes this readable:
 * it darkens the top edge behind the floating controls, tints the
 * photograph toward the ivory palette so the stage belongs to the light
 * theme, and fades the bottom into the page canvas — which is why the
 * featured panel below can overlap it without a visible seam.
 */
export function Hero({ settings }: { settings: SiteSettingsDTO }) {
  const { locale } = useTranslations();
  const heroTitle = localizedText(locale, settings.hero.titleAr, settings.hero.titleEn);

  return (
    <section className="mz-stage flex min-h-[clamp(36rem,84vh,52rem)] flex-col" aria-labelledby="hero-title">
      <HeroBackground key={settings.hero.backgroundImage} src={settings.hero.backgroundImage} />
      <span className="mz-stage-scrim" aria-hidden="true" />

      {/* The lower padding is the heavier of the two: the featured panel
          rides up over this edge, so the tagline needs clearance beneath it
          that the top does not. */}
      <div className="mz-container relative z-10 flex flex-1 flex-col items-center justify-center gap-8 pb-32 pt-24 text-center sm:gap-10 sm:pb-40 sm:pt-28">
        <div className="flex flex-col items-center gap-4">
          <MazadLogo src={settings.hero.logoUrl || settings.brand.logoUrl} className="h-24 w-[8.75rem] sm:h-32 sm:w-[11.5rem]" />
          <h1
            id="hero-title"
            className="text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-tight tracking-tight text-(--color-text)"
          >
            {heroTitle}
          </h1>
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}

function HeroBackground({ src }: { src: string }) {
  const [backgroundImage, setBackgroundImage] = useState(src);

  return (
    <Image
      src={backgroundImage}
      alt=""
      fill
      preload
      sizes="100vw"
      unoptimized
      onError={() => setBackgroundImage(DEFAULT_SITE_SETTINGS.hero.backgroundImage)}
      className="mz-stage-media"
    />
  );
}
