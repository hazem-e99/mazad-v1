import Image from "next/image";
import heroBg from "../../../public/images/bg-hero2.jpg";

/**
 * The hero's cinematic backdrop — a night skyline with a car on a wet road.
 *
 * The photograph carries no baked-in text, so every word on the hero stays
 * real HTML that translates and is read by assistive tech (§12). It is the
 * LCP element, hence `preload` plus the blur placeholder Next derives from
 * the static import.
 *
 * The scrims layered over it are what make copy legible on a photograph:
 * a flat wash pushes the frame behind the UI, a symmetric side vignette
 * darkens both columns — no direction check needed, it lands on the copy
 * whether the layout runs RTL or LTR — while leaving the car lit in the
 * middle, and a vertical fade hands the top edge to the sticky header and
 * the bottom edge to the page background so the section has no seam.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Image
        src={heroBg}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Flat wash. */}
      <span className="absolute inset-0 bg-(--color-bg)/40" />

      {/* Side vignette — one span per edge so both fades are identical.
          Stops just short of opaque so a little city light survives at the
          extremes rather than the frame ending in a hard black band. */}
      <span className="absolute inset-0 bg-linear-to-r from-(--color-bg)/90 to-transparent to-45%" />
      <span className="absolute inset-0 bg-linear-to-l from-(--color-bg)/90 to-transparent to-45%" />

      {/* Vertical fade into the header above and the page below. */}
      <span className="absolute inset-0 bg-linear-to-b from-(--color-bg) via-transparent via-40% to-(--color-bg)" />
    </div>
  );
}
