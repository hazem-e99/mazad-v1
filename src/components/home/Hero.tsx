"use client";

import { LinkButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

export function Hero() {
  const { t, locale } = useTranslations();
  const headline = t("home.heroHeadline");
  const headlineWords = locale === "ar" ? headline.trim().split(/\s+/) : [];
  const arabicHeadlineParts =
    locale === "ar" && headlineWords.length >= 4
      ? [headlineWords.slice(0, 2).join(" "), headlineWords.slice(2).join(" ")]
      : null;

  return (
    <section className="mz-hero relative isolate overflow-hidden bg-black text-white" aria-labelledby="hero-title">
      <video
        className="mz-hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/herosection.mp4" type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: [
            "linear-gradient(90deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.25) 35%, rgba(0, 0, 0, 0.70) 75%, rgba(0, 0, 0, 0.88) 100%)",
            "linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.05) 45%, rgba(0, 0, 0, 0.35) 100%)",
            "radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.35) 100%)",
          ].join(", "),
        }}
      />

      <div
        className="relative z-[2] flex h-full w-full max-w-none items-center justify-start px-[clamp(1.5rem,5vw,6rem)]"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <div
          className={cn(
            "mz-hero-content flex max-w-[620px] -translate-y-[clamp(2rem,5vh,3.125rem)] flex-col items-stretch",
            locale === "ar" ? "ml-auto mr-0 text-right" : "text-left"
          )}
          dir={locale === "ar" ? "rtl" : "ltr"}
          style={
            locale === "ar"
              ? {
                  alignItems: "stretch",
                  direction: "rtl",
                  marginLeft: "auto",
                  marginRight: 0,
                  textAlign: "right",
                  width: "min(620px, 100%)",
                }
              : undefined
          }
        >
          <p className={cn("mz-hero-reveal w-full text-[clamp(0.8125rem,0.9vw,0.9375rem)] font-medium uppercase tracking-[0.08em] text-(--color-gold)", locale === "ar" ? "text-right" : "text-left")}>
            {t("home.heroEyebrow")}
          </p>

          <h1
            id="hero-title"
            className={cn(
              "hero-title mz-hero-reveal mz-hero-reveal-2 mt-3 flex w-full max-w-full flex-col items-stretch text-[clamp(3.25rem,4vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-white",
              locale === "ar" ? "ml-auto mr-0 text-right" : "text-left"
            )}
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={
              locale === "ar"
                ? {
                    alignItems: "stretch",
                    direction: "rtl",
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: "auto",
                    marginRight: 0,
                    maxWidth: "620px",
                    textAlign: "right",
                    width: "100%",
                  }
                : undefined
            }
          >
            {arabicHeadlineParts ? (
              <>
                <span
                  className="hero-title-line block w-full text-right"
                  dir="rtl"
                  style={{ direction: "rtl", display: "block", margin: 0, padding: 0, textAlign: "right", width: "100%" }}
                >
                  {arabicHeadlineParts[0]}
                </span>
                <span
                  className="hero-title-line block w-full text-right"
                  dir="rtl"
                  style={{ direction: "rtl", display: "block", margin: 0, padding: 0, textAlign: "right", width: "100%" }}
                >
                  {arabicHeadlineParts[1]}
                </span>
              </>
            ) : (
              headline
            )}
          </h1>

          <p
            className={cn(
              "mz-hero-reveal mz-hero-reveal-3 mt-5 w-full max-w-[500px] text-[clamp(1.0625rem,1.25vw,1.1875rem)] leading-[1.7] text-white/76",
              locale === "ar" ? "self-end text-right" : "self-start text-left"
            )}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {t("home.heroDescription")}
          </p>

          <div
            className={cn(
              "mz-hero-reveal mz-hero-reveal-4 mt-7 flex w-full max-w-[500px] flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center",
              locale === "ar" ? "self-end" : "self-start"
            )}
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={locale === "ar" ? { direction: "rtl", justifyContent: "flex-start" } : undefined}
          >
            <LinkButton
              href="/auctions"
              variant="gold"
              size="lg"
              className="bg-white text-(--color-bg) shadow-[0_8px_24px_-12px_rgba(0,0,0,.8)] hover:bg-white/90 hover:brightness-100"
            >
              {t("home.heroPrimaryCta")}
            </LinkButton>
            <LinkButton
              href="/listings"
              variant="outline"
              size="lg"
              className="border-white/60 bg-black/20 text-white hover:border-white hover:bg-white/10 hover:text-white"
            >
              {t("home.heroSecondaryCta")}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
