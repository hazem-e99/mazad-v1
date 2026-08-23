/**
 * Brand marks drawn inline.
 *
 * lucide-react carries no brand glyphs, and pulling in a second icon pack
 * for four shapes would break the single-library rule — so they are drawn
 * here on the same 24px grid, taking `currentColor` and an optional
 * stroke width so they sit correctly beside the lucide icons they share a
 * row with.
 */
import { Link as LinkIcon, Mail, MessageCircle } from "lucide-react";
import type { SiteSocialPlatform } from "@/lib/siteSettings";

export type GlyphProps = { className?: string; strokeWidth?: number };

/**
 * Resolves a configured social link's platform to its mark. Header and
 * footer both render the same `settings.footer.socials` list, so the
 * mapping lives here rather than being restated in each — two copies drift,
 * and a platform added to only one of them renders as a bare link there.
 */
export function SocialIcon({ platform, className }: { platform: SiteSocialPlatform; className?: string }) {
  if (platform === "whatsapp") return <MessageCircle className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "instagram") return <InstagramGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "snapchat") return <SnapchatGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "tiktok") return <TikTokGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "x") return <XGlyph className={className} aria-hidden="true" strokeWidth={1.75} />;
  if (platform === "email") return <Mail className={className} aria-hidden="true" strokeWidth={1.75} />;
  return <LinkIcon className={className} aria-hidden="true" strokeWidth={1.75} />;
}

export function XGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M13.72 10.47 20.5 2.5h-1.9l-5.9 6.93L8 2.5H2.5l7.13 10.4-7.13 8.6h1.9l6.24-7.33 4.98 7.33H21l-7.4-11.03Zm-2.2 2.59-.72-1.04L5.1 3.94h2.5l4.65 6.7.72 1.04 6.05 8.72h-2.5l-4.93-7.1Z" />
    </svg>
  );
}

export function InstagramGlyph({ className, strokeWidth = 2 }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function TikTokGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M16.5 2h-2.9v13.2a2.6 2.6 0 1 1-2.2-2.57V9.66a5.66 5.66 0 1 0 5.1 5.63V8.9a6.6 6.6 0 0 0 3.9 1.27V7.2a3.75 3.75 0 0 1-3.9-3.7V2Z" />
    </svg>
  );
}

export function SnapchatGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2.2c2.6 0 4.4 1.9 4.5 4.5 0 .6 0 1.3-.06 1.9.3.13.66.15.98.02.2-.08.42-.12.63-.12.5 0 .93.33.93.8 0 .43-.33.74-1.02 1.02-.1.04-.24.08-.38.13-.45.14-1.02.32-1.17.68-.08.19-.04.42.1.7l.02.02c.05.1 1.2 2.63 3.66 3.04.2.03.33.2.32.4 0 .1-.03.2-.08.3-.28.65-1.46.94-2.72 1.13-.13.02-.18.2-.25.5l-.04.2c-.05.2-.1.44-.2.62-.1.2-.28.24-.47.24-.2 0-.44-.04-.72-.1a5.2 5.2 0 0 0-1.05-.13c-.24 0-.48.02-.72.06-.47.08-.88.37-1.35.7-.68.48-1.44 1.02-2.6 1.02h-.13c-1.15 0-1.92-.54-2.6-1.02-.47-.33-.88-.62-1.35-.7a4.4 4.4 0 0 0-.72-.06c-.4 0-.75.06-1.05.12-.28.06-.52.1-.72.1-.26 0-.4-.1-.47-.23-.1-.18-.15-.4-.2-.63l-.04-.2c-.07-.28-.12-.47-.25-.5-1.26-.18-2.44-.47-2.72-1.12a.72.72 0 0 1-.08-.3.4.4 0 0 1 .32-.4c2.46-.4 3.6-2.94 3.66-3.05v-.02c.15-.28.2-.5.1-.7-.14-.35-.7-.53-1.16-.67l-.38-.13c-.9-.36-1.03-.76-.98-1.04.07-.36.5-.62.93-.62.13 0 .25.03.35.07.36.17.68.26.95.26.2 0 .34-.05.42-.1l-.06-.9c-.12-1.9-.26-4.28 1.35-6.08A5.9 5.9 0 0 1 11.9 2.2H12Z" />
    </svg>
  );
}
