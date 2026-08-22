/**
 * The hero's cinematic backdrop — a night city with a wet road, drawn
 * entirely as one inline SVG.
 *
 * Deliberately not a photograph: it weighs a couple of kilobytes instead
 * of a few hundred, is resolution-independent, needs no art direction per
 * breakpoint, and — critically for §12 — contains no baked-in text, so
 * every word on the hero stays real HTML that translates and is readable
 * by assistive tech.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="mz-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080d14" />
          <stop offset="55%" stopColor="#0c1420" />
          <stop offset="100%" stopColor="#141c2b" />
        </linearGradient>

        <linearGradient id="mz-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#131a26" />
          <stop offset="100%" stopColor="#080c12" />
        </linearGradient>

        <radialGradient id="mz-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ecbd33" stopOpacity=".55" />
          <stop offset="100%" stopColor="#ecbd33" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="mz-reflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecbd33" stopOpacity=".35" />
          <stop offset="100%" stopColor="#ecbd33" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="mz-vignette" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#080d14" stopOpacity=".95" />
          <stop offset="35%" stopColor="#080d14" stopOpacity="0" />
          <stop offset="65%" stopColor="#080d14" stopOpacity="0" />
          <stop offset="100%" stopColor="#080d14" stopOpacity=".95" />
        </linearGradient>

        <filter id="mz-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="800" height="500" fill="url(#mz-sky)" />

      {/* Skyline — two parallax layers, the far one dimmer and flatter. */}
      <g fill="#0b1220" opacity=".9">
        <rect x="20" y="180" width="46" height="180" />
        <rect x="74" y="215" width="34" height="145" />
        <rect x="118" y="150" width="52" height="210" />
        <rect x="182" y="200" width="30" height="160" />
        <rect x="640" y="165" width="48" height="195" />
        <rect x="696" y="205" width="36" height="155" />
        <rect x="742" y="145" width="44" height="215" />
      </g>
      <g fill="#101a29">
        <rect x="228" y="120" width="58" height="240" />
        <rect x="296" y="175" width="40" height="185" />
        <rect x="346" y="95" width="66" height="265" />
        <rect x="422" y="160" width="44" height="200" />
        <rect x="476" y="130" width="54" height="230" />
        <rect x="540" y="190" width="38" height="170" />
        <rect x="588" y="150" width="42" height="210" />
      </g>

      {/* Lit windows: a sparse, irregular grid so the towers read as
          inhabited rather than as a texture. */}
      <g fill="#ecbd33" opacity=".5">
        {[
          [238, 140], [258, 140], [238, 168], [272, 196], [238, 224], [258, 252],
          [356, 118], [380, 118], [356, 148], [396, 148], [356, 178], [380, 208],
          [356, 238], [396, 268], [486, 152], [508, 152], [486, 182], [508, 212],
          [486, 242], [432, 184], [432, 214], [452, 244], [598, 172], [618, 202],
          [598, 232], [128, 174], [148, 174], [128, 204], [148, 234], [652, 188],
          [672, 218], [752, 168], [772, 198], [752, 228],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="7" height="10" rx="1" />
        ))}
      </g>

      {/* Warm horizon glow behind the skyline. */}
      <ellipse cx="400" cy="360" rx="330" ry="60" fill="url(#mz-halo)" filter="url(#mz-soft)" />

      {/* Wet road. */}
      <rect y="352" width="800" height="148" fill="url(#mz-road)" />
      <rect y="352" width="800" height="1.5" fill="#ecbd33" opacity=".25" />

      {/* Reflections — vertical smears of the city lights on the wet
          surface, widening as they fall (near-field perspective). */}
      <g opacity=".55">
        {[
          [150, 10], [242, 14], [368, 18], [452, 12], [498, 16], [604, 12], [702, 14],
        ].map(([x, w], i) => (
          <rect key={i} x={x} y="354" width={w} height="120" fill="url(#mz-reflect)" filter="url(#mz-soft)" />
        ))}
      </g>

      {/* Automotive light trails — two red tail-light streaks and one warm
          headlight sweep, the only saturated marks in the frame. */}
      <g filter="url(#mz-soft)">
        <rect x="80" y="418" width="230" height="4" rx="2" fill="#ef4444" opacity=".45" />
        <rect x="120" y="436" width="170" height="3" rx="1.5" fill="#ef4444" opacity=".3" />
        <rect x="500" y="404" width="260" height="4" rx="2" fill="#ecbd33" opacity=".5" />
        <rect x="560" y="424" width="190" height="3" rx="1.5" fill="#f4cd5a" opacity=".3" />
      </g>

      {/* Side vignette so the copy column always sits on flat ground. */}
      <rect width="800" height="500" fill="url(#mz-vignette)" />
    </svg>
  );
}
