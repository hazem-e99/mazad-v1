import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectDB } from "@/lib/db";
import { SiteAsset } from "@/models/SiteAsset";
import { saveImage, getStoredAsset, imageExists, deleteImage } from "@/lib/storage";

const TEST_SUBDIR = `vitest-storage-${Date.now()}`;

// A minimal, valid 1x1 PNG — real bytes sharp can actually decode, not a
// placeholder string, so the "sharp available" path genuinely exercises
// rotate/resize/webp-encode rather than just not-crashing.
const ONE_PX_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngFile(name = "pixel.png"): File {
  const bytes = Buffer.from(ONE_PX_PNG_BASE64, "base64");
  return new File([bytes], name, { type: "image/png" });
}

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await SiteAsset.deleteMany({ subdir: TEST_SUBDIR });
});

describe("saveImage — sharp available (this dev/CI host)", () => {
  it("optimizes to webp, storing a .webp key with image/webp content type", async () => {
    const url = await saveImage(pngFile(), TEST_SUBDIR);
    expect(url).toMatch(/^\/api\/site-assets\/[a-f0-9-]+\.webp$/);

    const key = url.replace("/api/site-assets/", "");
    const stored = await getStoredAsset(key);
    expect(stored).not.toBeNull();
    expect(stored?.contentType).toBe("image/webp");

    expect(await imageExists(url)).toBe(true);
    await deleteImage(url);
    expect(await imageExists(url)).toBe(false);
  });
});
