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
  const { locale, t } = useTranslations();
  const heroTitle = localizedText(locale, settings.hero.titleAr, settings.hero.titleEn).trim();

  return (
    <section
      className="mz-stage flex aspect-[853/1844] flex-col sm:aspect-auto sm:min-h-[clamp(36rem,84vh,52rem)]"
      {...(heroTitle ? { "aria-labelledby": "hero-title" } : { "aria-label": t("home.heroEyebrow") })}
    >
      <HeroBackground key={settings.hero.backgroundImage} src={settings.hero.backgroundImage} />
      <span className="mz-stage-scrim" aria-hidden="true" />

      {/* Mobile is bottom-anchored (justify-end + a fixed pb) rather than
          vertically centered: the hero's height is a fixed aspect ratio of
          the viewport width (see the section above), so centering would
          drift the tagline/search block up or down as that width changes
          across phones. A fixed offset from the bottom keeps it landing at
          the same spot on the photo (over the lower third, above the gold
          band) regardless of device height. Desktop switches back to
          centering — its stage uses a min-height instead of a fixed aspect
          ratio, so there's no equivalent drift to guard against. */}
      <div className="mz-container relative z-10 flex flex-1 flex-col items-center justify-evenly gap-8 pb-16 text-center sm:justify-center sm:gap-10 sm:pb-40 sm:pt-28">
        <div className="flex flex-col items-center gap-4">
          {/* The mark competes with the photo itself on mobile — hidden
              there, shown again once the desktop stage's calmer crop
              gives it room. */}
          <div className="hidden sm:inline-flex">
            <MazadLogo src={settings.hero.logoUrl || settings.brand.logoUrl} className="h-24 w-[8.75rem] sm:h-32 sm:w-[11.5rem]" />
          </div>
          {heroTitle && (
            <h1
              id="hero-title"
              className="text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-tight tracking-tight text-white sm:text-(--color-text)"
            >
              {heroTitle}
            </h1>
          )}
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}

const MOBILE_HERO_IMAGE = "/images/bg-hero-mobile.png";

function HeroBackground({ src }: { src: string }) {
  const [backgroundImage, setBackgroundImage] = useState(src);
  const [mobileImage, setMobileImage] = useState(MOBILE_HERO_IMAGE);

  return (
    <>
      {/* Mobile: the stage's own aspect-ratio matches this photo's
          (853:1844) exactly, so `cover` fills the frame with no crop and
          no letterboxing gaps — the whole image, edge to edge. */}
      <Image
        src={mobileImage}
        alt=""
        fill
        preload
        sizes="100vw"
        unoptimized
        onError={() => setMobileImage(backgroundImage)}
        className="mz-stage-media sm:hidden"
      />
      <Image
        src={backgroundImage}
        alt=""
        fill
        preload
        sizes="100vw"
        unoptimized
        onError={() => setBackgroundImage(DEFAULT_SITE_SETTINGS.hero.backgroundImage)}
        className="mz-stage-media hidden sm:block"
      />
    </>
  );
}
