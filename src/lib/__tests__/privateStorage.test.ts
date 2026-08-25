import { describe, it, expect, afterAll } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { saveOwnershipDocument, readOwnershipDocument, deleteOwnershipDocument } from "@/lib/privateStorage";

const PRIVATE_UPLOAD_DIR = process.env.PRIVATE_UPLOAD_DIR ?? "./private-uploads";
const TEST_SUBDIR = `vitest-ownership-${Date.now()}`;

const ONE_PX_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngFile(name = "istimara.png"): File {
  return new File([Buffer.from(ONE_PX_PNG_BASE64, "base64")], name, { type: "image/png" });
}

afterAll(async () => {
  await rm(path.join(PRIVATE_UPLOAD_DIR, TEST_SUBDIR), { recursive: true, force: true });
});

describe("saveOwnershipDocument — sharp available (this dev/CI host)", () => {
  it("optimizes to webp and stores it under PRIVATE_UPLOAD_DIR with a .webp ref", async () => {
    const stored = await saveOwnershipDocument(pngFile(), TEST_SUBDIR);
    expect(stored.ref).toMatch(new RegExp(`^${TEST_SUBDIR}/[a-f0-9-]+\\.webp$`));
    expect(stored.contentType).toBe("image/webp");

    const read = await readOwnershipDocument(stored.ref);
    expect(read.contentType).toBe("image/webp");
    expect(read.buffer.byteLength).toBeGreaterThan(0);

    await deleteOwnershipDocument(stored.ref);
    await expect(readOwnershipDocument(stored.ref)).rejects.toThrow();
  });
});
