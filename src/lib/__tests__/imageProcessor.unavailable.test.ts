import { describe, it, expect, vi } from "vitest";

// Simulates this project's actual production VPS: a CPU old enough that
// neither sharp's native binary nor its WASM fallback can run. Mocked at
// the top of this file (hoisted, applies to every dynamic `import("sharp")`
// for the whole file) so it doesn't affect any other test file's use of
// the real, working sharp on this machine.
vi.mock("sharp", () => {
  throw new Error("CompileError: WebAssembly.Module(): Wasm SIMD unsupported");
});

describe("imageProcessor when sharp cannot load on this host", () => {
  it("getImageCapability() never throws — reports unavailable instead", async () => {
    const { getImageCapability } = await import("@/lib/imageProcessor");
    const capability = await getImageCapability();
    expect(capability.available).toBe(false);
  });

  it("getImageCapability() does not leak sharp's raw error text", async () => {
    const { getImageCapability } = await import("@/lib/imageProcessor");
    const capability = await getImageCapability();
    // The capability result itself carries no message field at all in the
    // unavailable case — nothing for a caller to accidentally forward to a
    // user. (The one-time console.warn is operator-facing, not user-facing.)
    expect(capability).toEqual({ available: false });
  });

  it("getSharp() (the throwing, no-fallback variant) rejects with a clear message, not sharp's own crash", async () => {
    const { getSharp } = await import("@/lib/imageProcessor");
    await expect(getSharp()).rejects.toThrow(/unavailable on this host/i);
  });

  it("getSharp()'s error never mentions the old, misleading '@img/sharp-wasm32 not installed' advice", async () => {
    const { getSharp } = await import("@/lib/imageProcessor");
    let message = "";
    try {
      await getSharp();
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).not.toMatch(/ensure.*sharp-wasm32.*installed/i);
    expect(message.length).toBeGreaterThan(0);
  });
});
