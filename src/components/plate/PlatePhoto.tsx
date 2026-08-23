"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * An uploaded photo that degrades to `fallback` when the file behind it is
 * not actually there.
 *
 * A non-null `image` field is not a promise that the file exists. Photos
 * are written to gitignored local storage (UPLOAD_DIR in src/lib/storage.ts)
 * while the Plate rows live in the shared database, so any clone that did
 * not perform the upload itself inherits paths with nothing behind them —
 * and a plain `<img>` renders the browser's broken-image glyph, which is
 * far worse than showing no photo at all. Every public surface that draws a
 * user-supplied plate photo should go through this.
 *
 * `server/repairPlateImages.ts` is the data-side half of the same problem:
 * this keeps the page correct, that stops the bad rows accumulating.
 */
export function PlatePhoto({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Drawn when there is no photo, or when the photo fails to load. */
  fallback: ReactNode;
}) {
  // Keyed by the URL that failed rather than a bare boolean: a card that is
  // recycled for a different listing must get a fresh attempt, not inherit
  // the previous row's failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />
  );
}
