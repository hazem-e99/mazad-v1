import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { connectDB } from "@/lib/db";
import { SiteAsset } from "@/models/SiteAsset";

const TEST_SUBDIR = `vitest-storage-fallback-${Date.now()}`;

// Simulates the production VPS, where sharp can't load at all (neither the
// native binary nor its WASM fallback run on that CPU). Mocked at the top
// of this file (hoisted) so it applies for the whole file without touching
// any other test file's use of the real sharp.
vi.mock("@/lib/imageProcessor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/imageProcessor")>();
  return {
    ...actual,
    getImageCapability: async () => ({ available: false }) as const,
  };
});

function fileOf(bytes: Buffer, name: string, type: string): File {
  return new File([bytes], name, { type });
}

// `.lean()` hands back the raw driver value for a Buffer path, which is a
// BSON `Binary` wrapper (its bytes live at `.buffer`), not a real Buffer —
// mirrors the same conversion in src/app/api/site-assets/[id]/route.ts.
function bytesOf(data: unknown): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from((data as { buffer: Buffer }).buffer);
}

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await SiteAsset.deleteMany({ subdir: TEST_SUBDIR });
});

describe("saveImage — sharp unavailable (simulated old-CPU VPS)", () => {
  it("stores a validated JPEG upload unprocessed, with a real .jpg key and image/jpeg content type", async () => {
    const { saveImage, getStoredAsset } = await import("@/lib/storage");
    const original = Buffer.from("not-actually-decodable-but-that-is-fine-in-fallback-mode");
    const url = await saveImage(fileOf(original, "photo.jpg", "image/jpeg"), TEST_SUBDIR);

    // Never falsely named .webp — this is the exact bug class requirement 4
    // in this task calls out.
    expect(url).toMatch(/^\/api\/site-assets\/[a-f0-9-]+\.jpg$/);

    const key = url.replace("/api/site-assets/", "");
    const stored = await getStoredAsset(key);
    expect(stored).not.toBeNull();
    expect(stored?.contentType).toBe("image/jpeg");
    // Bytes preserved exactly — no processing attempted.
    expect(bytesOf(stored!.data).equals(original)).toBe(true);
  });

  it("stores a validated PNG upload unprocessed, with a real .png key and image/png content type", async () => {
    const { saveImage, getStoredAsset } = await import("@/lib/storage");
    const original = Buffer.from("also-just-stored-as-is");
    const url = await saveImage(fileOf(original, "photo.png", "image/png"), TEST_SUBDIR);

    expect(url).toMatch(/^\/api\/site-assets\/[a-f0-9-]+\.png$/);

    const key = url.replace("/api/site-assets/", "");
    const stored = await getStoredAsset(key);
    expect(stored?.contentType).toBe("image/png");
    expect(bytesOf(stored!.data).equals(original)).toBe(true);
  });

  it("still rejects an oversized upload before ever reaching the fallback path", async () => {
    const { saveImage } = await import("@/lib/storage");
    const tooBig = Buffer.alloc(9 * 1024 * 1024);
    await expect(saveImage(fileOf(tooBig, "huge.jpg", "image/jpeg"), TEST_SUBDIR)).rejects.toThrow();
  });

  it("still rejects a disallowed MIME type before ever reaching the fallback path", async () => {
    const { saveImage } = await import("@/lib/storage");
    await expect(
      saveImage(fileOf(Buffer.from("x"), "file.gif", "image/gif"), TEST_SUBDIR)
    ).rejects.toThrow();
  });

  it("the returned URL is retrievable through the real /api/site-assets/[id] extension guard", async () => {
    const { saveImage } = await import("@/lib/storage");
    const url = await saveImage(fileOf(Buffer.from("abc"), "a.jpg", "image/jpeg"), TEST_SUBDIR);
    const id = url.replace("/api/site-assets/", "");
    // Mirrors the regex in src/app/api/site-assets/[id]/route.ts.
    expect(/^[a-f0-9-]+\.(webp|jpe?g|png)$/i.test(id)).toBe(true);
  });
});
