import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The لوحتي mark — the gold crown over the wordmark.
 *
 * Artwork rather than drawn markup: the brushed-gold gradients and
 * bevelled outlines are not something CSS reproduces honestly. The file is
 * the supplied logo.png with its opaque near-white background keyed out
 * and the transparent margin trimmed, so the box below controls the
 * spacing instead of the asset's own padding.
 *
 * `fill` + `object-contain` means the mark fits whatever box the caller
 * sets through `className` — it can never stretch, and a caller passing a
 * square box gets a correctly letterboxed mark rather than a squashed one.
 * The artwork is ~1.39:1, so callers wanting it to fill the width should
 * pass a box in roughly that ratio.
 */
export function MazadLogo({ className, src = "/images/logo-mark.png" }: { className?: string; src?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 12rem, 20rem"
        className="object-contain"
      />
    </span>
  );
}
