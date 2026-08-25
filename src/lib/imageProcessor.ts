import type sharpType from "sharp";

/**
 * Single place that knows how to obtain a working `sharp` instance.
 *
 * sharp's own loader (node_modules/sharp/dist/sharp.cjs) already handles
 * native-vs-WebAssembly selection internally: it tries the native
 * platform binary first, and — specifically for linux-x64/linuxmusl-x64
 * hosts whose CPU lacks the x86-64-v2 baseline (SSE4.2) sharp's prebuilt
 * binaries require — falls back to the WASM build automatically. That
 * fallback only has something to load if `@img/sharp-wasm32` is actually
 * installed, which is why it's declared in this project's package.json
 * (optionalDependencies) even though nothing here imports it by name.
 * This module's only job is to load `sharp` itself lazily (never at
 * module top-level, so an unrelated route that merely imports
 * deleteImage()/etc. from storage.ts never pays for — or can be broken
 * by — a native/WASM loading failure) and to turn a total load failure
 * (both native and WASM unavailable) into a clear, actionable error
 * instead of sharp's own internal crash when that happens.
 */
let sharpPromise: Promise<typeof sharpType> | null = null;

export async function getSharp(): Promise<typeof sharpType> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((mod) => mod.default)
      .catch((err: unknown) => {
        sharpPromise = null;
        const cause = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Image processing is unavailable: sharp failed to load (both the native binary and the ` +
            `@img/sharp-wasm32 fallback). Ensure "@img/sharp-wasm32" is installed alongside "sharp". Cause: ${cause}`
        );
      });
  }
  return sharpPromise;
}
