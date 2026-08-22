/**
 * The Saudi national emblem — two crossed swords beneath a date palm —
 * drawn as inline SVG so it stays crisp at every plate size, costs no
 * network request, and inherits `currentColor` from the plate chrome.
 *
 * This is the *fallback* emblem: a plate whose record points at an
 * admin-managed PlateLogo renders that uploaded artwork instead (see
 * PlateLogoIcon). Plates with no logo selected previously showed an empty
 * gap where the country mark belongs, which is the one piece of chrome a
 * real Saudi plate never omits.
 */
export function SaudiEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true" focusable="false">
      {/* Crossed swords */}
      <g fill="currentColor">
        <path d="M6.2 34.4 30.6 24.9l1.1 2.7-24.4 9.5z" />
        <path d="M41.8 34.4 17.4 24.9l-1.1 2.7 24.4 9.5z" />
        {/* Hilts */}
        <path d="M4.4 33.1c-1.3.5-2 2-1.5 3.3s2 2 3.3 1.5l1.6-.6-1.8-4.8z" />
        <path d="M43.6 33.1c1.3.5 2 2 1.5 3.3s-2 2-3.3 1.5l-1.6-.6 1.8-4.8z" />
        {/* Blade tips */}
        <path d="M29.4 21.9 33.9 20l1.2 3-4.6 1.8z" opacity=".9" />
        <path d="M18.6 21.9 14.1 20l-1.2 3 4.6 1.8z" opacity=".9" />
      </g>
      {/* Date palm */}
      <g fill="currentColor">
        <path d="M23.2 12.6h1.6c.5 0 .8.4.8.9l-.6 12.9h-2l-.6-12.9c0-.5.3-.9.8-.9z" />
        <path d="M24 4.6c1.4 0 2.6 1 2.9 2.3-.9-.5-1.9-.8-2.9-.8s-2 .3-2.9.8c.3-1.3 1.5-2.3 2.9-2.3z" />
        <path d="M24 7.3c2.6 0 4.9 1.4 6.1 3.5-1.6-1.1-3.7-1.7-6.1-1.7s-4.5.6-6.1 1.7c1.2-2.1 3.5-3.5 6.1-3.5z" />
        <path d="M24 10.2c3.9 0 7.3 1.9 9.2 4.7-2.4-1.7-5.6-2.7-9.2-2.7s-6.8 1-9.2 2.7c1.9-2.8 5.3-4.7 9.2-4.7z" />
        <path d="M13.2 12.4c-1.9 1.2-3.4 3-4.2 5.2 2-1.9 4.7-3.3 7.9-4-1.4-.5-2.6-.9-3.7-1.2z" />
        <path d="M34.8 12.4c1.9 1.2 3.4 3 4.2 5.2-2-1.9-4.7-3.3-7.9-4 1.4-.5 2.6-.9 3.7-1.2z" />
      </g>
    </svg>
  );
}
