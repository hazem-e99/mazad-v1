import type sharpType from "sharp";

type SharpModule = typeof sharpType;

interface LoadResult {
  ok: boolean;
  sharp?: SharpModule;
  error?: Error;
}

/**
 * Single place that knows how to obtain a working `sharp` instance.
 *
 * sharp's own loader (node_modules/sharp/dist/sharp.cjs) already handles
 * native-vs-WebAssembly selection internally: it tries the native
 * platform binary first, and — specifically for linux-x64/linuxmusl-x64
 * hosts whose CPU lacks the x86-64-v2 baseline (SSE4.2) sharp's prebuilt
 * binaries require — falls back to the WASM build (`@img/sharp-wasm32`,
 * declared in this project's optionalDependencies). On this project's
 * production VPS, even that WASM fallback can fail — the CPU is old
 * enough that V8 itself can't compile WebAssembly SIMD instructions
 * (`CompileError: WebAssembly.Module(): Wasm SIMD unsupported`), which
 * the WASM build uses. That's a genuine hardware ceiling: there is no
 * further software fallback within sharp for it.
 *
 * So this module treats "sharp cannot load at all" as an expected,
 * non-fatal runtime condition rather than an error to keep chasing —
 * see getImageCapability() below, which callers use to decide whether to
 * process images or fall back to storing them unprocessed.
 */
let loadPromise: Promise<LoadResult> | null = null;

function loadSharp(): Promise<LoadResult> {
  if (!loadPromise) {
    loadPromise = import("sharp")
      .then((mod): LoadResult => ({ ok: true, sharp: mod.default }))
      .catch(
        (err: unknown): LoadResult => ({
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
        })
      );
  }
  return loadPromise;
}

export type ImageCapability = { available: true; sharp: SharpModule } | { available: false };

let warnedUnavailable = false;

/**
 * Non-throwing capability probe for request-time upload handling, which
 * has a graceful fallback (store the file unprocessed — see
 * src/lib/storage.ts and src/lib/privateStorage.ts). Never rejects: a
 * load failure is reported as `{ available: false }` and logged once
 * (not once per request) as a warning, not an error — this is an
 * expected condition on this host, not a bug.
 *
 * The result is cached for the process lifetime: the CPU's capabilities
 * can't change while the process is running, so there's no reason to
 * retry — let alone repeatedly pay for — a doomed WASM compile on every
 * upload.
 */
export async function getImageCapability(): Promise<ImageCapability> {
  const result = await loadSharp();
  if (result.ok) return { available: true, sharp: result.sharp! };

  if (!warnedUnavailable) {
    warnedUnavailable = true;
    console.warn(
      "[imageProcessor] Image optimization is disabled on this host: sharp could not load " +
        "(this CPU doesn't support what either the native binary or the WebAssembly fallback " +
        "require). Uploads will be stored as-is — original bytes, original format — instead of " +
        `being resized/converted to WebP. Underlying error: ${result.error?.message ?? "unknown"}`
    );
  }
  return { available: false };
}

/**
 * Throwing variant for call sites with no fallback path — CLI-only
 * seed/migration tooling (server/plateLogoAssets.ts, server/platePhotoAsset.ts)
 * that rasterizes placeholder artwork and has nothing sensible to fall
 * back to. Never used by request-time upload handling; those call
 * getImageCapability() instead so a missing sharp doesn't fail the
 * upload. The thrown message is deliberately free of sharp's own
 * internal error text/stack — safe to surface as-is in a CLI context.
 */
export async function getSharp(): Promise<SharpModule> {
  const result = await loadSharp();
  if (!result.ok) {
    throw new Error(
      "Image processing (sharp) is unavailable on this host — neither the native binary nor the " +
        "WebAssembly fallback can run on this CPU, and this operation has no fallback."
    );
  }
  return result.sharp!;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Safe file extension for a validated image MIME type. Never assumes
 * `.webp` — that was only ever true because sharp always re-encoded to
 * WebP; in fallback mode the original format is preserved as-is, so the
 * extension has to match the real bytes being written.
 */
export function extensionForMime(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? "bin";
}

/** Inverse of extensionForMime() — used to recover a stored file's real
 * content type from its extension when no separate content-type field
 * was persisted (see src/lib/privateStorage.ts:readOwnershipDocument). */
export function mimeForExtension(extension: string): string | undefined {
  return MIME_BY_EXTENSION[extension.toLowerCase()];
}
