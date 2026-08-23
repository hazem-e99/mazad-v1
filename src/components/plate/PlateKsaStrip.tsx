import { PlateLogoIcon } from "@/components/plate/PlateLogoIcon";
import { SaudiEmblem } from "@/components/plate/SaudiEmblem";
import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";
import type { PlateAccent } from "@/components/plate/plateSpec";

/**
 * The country strip at the end of every Saudi plate: the national emblem
 * over the word السعودية, then K S A stacked vertically.
 *
 * This is also the only part of the face that carries the category
 * colour. A yellow taxi plate is a white plate with a yellow strip — not
 * a yellow plate — which is why the fill lives here and not on the plate
 * container, and why the ink colour travels with it.
 *
 * The small glyph under the letters is the category marker stamped on
 * real stock (a disc for private, a triangle for the transport classes).
 */
export function PlateKsaStrip({
  accent,
  logo,
  locale = "ar",
}: {
  accent: PlateAccent;
  /** Shown in place of the national emblem when the plate carries an
   * admin-managed logo, matching the reference stock. */
  logo?: PlateLogoDTO | null;
  locale?: Locale;
}) {
  return (
    <div
      className="relative z-10 flex h-full flex-col items-center justify-center gap-[0.3cqi] border-s-[0.4cqi] border-black px-[0.4cqi] py-[0.5cqi] text-center"
      style={{ background: accent.strip, color: accent.stripInk }}
    >
      <span className="flex h-[clamp(0.5rem,5.4cqi,2.6rem)] w-[clamp(0.5rem,5.4cqi,2.6rem)] items-center justify-center">
        {logo ? (
          <PlateLogoIcon logo={logo} locale={locale} className="h-full w-full object-contain" />
        ) : (
          <SaudiEmblem className="h-full w-full" />
        )}
      </span>

      {/* The Arabic country word sits between the emblem and the Latin
          stack on real stock. It is set very small deliberately — it is a
          legal marking, not a label anyone reads at card size. */}
      <span className="block whitespace-nowrap font-[800] leading-none text-[clamp(0.16rem,1.55cqi,0.8rem)] tracking-[0.02em]">
        السعودية
      </span>

      <span className="flex flex-col items-center leading-none">
        {["K", "S", "A"].map((letter) => (
          <span
            key={letter}
            className="block font-[800] leading-[1.06] tracking-[0.04em] text-[clamp(0.3rem,3.1cqi,1.6rem)]"
          >
            {letter}
          </span>
        ))}
      </span>

      {accent.marker && <CategoryMarker marker={accent.marker} />}
    </div>
  );
}

/**
 * The category symbol, one per usage class (see getPlateUsageStyle).
 *
 * Drawn rather than typed: the reference markers are solid geometric
 * shapes, and a text glyph (▲/●/◄) renders at a different weight and
 * baseline in every font that happens to be installed. Each takes its
 * colour from the strip's ink via `currentColor`, so it stays legible on
 * the yellow, blue, green and silver fills alike.
 */
const MARKER_CLIP: Record<Exclude<NonNullable<PlateAccent["marker"]>, "circle" | "bars">, string> = {
  "triangle-up": "polygon(50% 0, 100% 100%, 0 100%)",
  "triangle-down": "polygon(0 0, 100% 0, 50% 100%)",
  "triangle-left": "polygon(100% 0, 100% 100%, 0 50%)",
  diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
};

function CategoryMarker({ marker }: { marker: NonNullable<PlateAccent["marker"]> }) {
  const size = "clamp(0.12rem,1.5cqi,0.72rem)";

  if (marker === "circle") {
    return (
      <span aria-hidden="true" className="block rounded-full bg-current" style={{ width: size, height: size }} />
    );
  }

  // Two stacked rules, the racing-stripe reading — sport has no official
  // colour in the references, so the marker is what separates it from a
  // private plate.
  if (marker === "bars") {
    return (
      <span aria-hidden="true" className="flex flex-col justify-center" style={{ width: size, gap: "22%" }}>
        <span className="block bg-current" style={{ height: "26%" }} />
        <span className="block bg-current" style={{ height: "26%" }} />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block bg-current"
      style={{ width: size, height: size, clipPath: MARKER_CLIP[marker] }}
    />
  );
}
