"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * App-store badges drawn as markup rather than shipped as raster art: the
 * store name is real text (so it translates, scales and is selectable),
 * and there is no image to go blurry on a high-DPI screen.
 *
 * `href="#"` is intentional until the apps ship — the badges are part of
 * the footer composition the design calls for, and pointing them at a
 * placeholder store listing would be worse than an inert control.
 */
function Badge({ glyph, caption, name }: { glyph: React.ReactNode; caption: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3.5 py-2 text-(--color-text)">
      <span className="shrink-0 text-(--color-text)" aria-hidden="true">
        {glyph}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] text-(--color-text-faint)">{caption}</span>
        <span className="text-sm font-semibold">{name}</span>
      </span>
    </span>
  );
}

export function AppStoreBadge() {
  const { t } = useTranslations();
  return (
    <Badge
      caption={t("footer.downloadOn")}
      name="App Store"
      glyph={
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
          <path d="M16.36 12.63c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.18-1.72-1.35-.14-2.64.79-3.33.79-.69 0-1.75-.77-2.87-.75-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.83-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.51ZM14.2 5.9c.6-.74 1.01-1.75.9-2.77-.87.04-1.94.59-2.57 1.32-.56.64-1.06 1.68-.93 2.67.98.07 1.98-.5 2.6-1.22Z" />
        </svg>
      }
    />
  );
}

export function GooglePlayBadge() {
  const { t } = useTranslations();
  return (
    <Badge
      caption={t("footer.getItOn")}
      name="Google Play"
      glyph={
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
          <path d="M3.6 2.4a1 1 0 0 0-.6.92v17.36a1 1 0 0 0 .6.92l9.4-9.6-9.4-9.6Zm10.8 8.4 2.8-2.86-8.9-5.03a1 1 0 0 0-.3-.1l6.4 7.99Zm0 2.4-6.4 8a1 1 0 0 0 .3-.1l8.9-5.04-2.8-2.86Zm4.2-3.8-2.34 2.6 2.34 2.6 1.9-1.07a1.75 1.75 0 0 0 0-3.06l-1.9-1.07Z" />
        </svg>
      }
    />
  );
}
