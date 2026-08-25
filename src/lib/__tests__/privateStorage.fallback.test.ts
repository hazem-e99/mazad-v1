import { describe, it, expect, afterAll, vi } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";

const PRIVATE_UPLOAD_DIR = process.env.PRIVATE_UPLOAD_DIR ?? "./private-uploads";
const TEST_SUBDIR = `vitest-ownership-fallback-${Date.now()}`;

// Simulates the production VPS, where sharp can't load at all. Mocked at
// the top of this file (hoisted) so it applies for the whole file without
// touching any other test file's use of the real sharp.
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

afterAll(async () => {
  await rm(path.join(PRIVATE_UPLOAD_DIR, TEST_SUBDIR), { recursive: true, force: true });
});

describe("saveOwnershipDocument — sharp unavailable (simulated old-CPU VPS)", () => {
  it("saves a validated JPEG unprocessed with a real .jpg extension and correct content type on read-back", async () => {
    const { saveOwnershipDocument, readOwnershipDocument } = await import("@/lib/privateStorage");
    const original = Buffer.from("registration-photo-bytes-stored-as-is");
    const stored = await saveOwnershipDocument(fileOf(original, "istimara.jpg", "image/jpeg"), TEST_SUBDIR);

    // Never falsely named .webp.
    expect(stored.ref).toMatch(new RegExp(`^${TEST_SUBDIR}/[a-f0-9-]+\\.jpg$`));
    expect(stored.contentType).toBe("image/jpeg");

    // readOwnershipDocument() has no separate DB field to consult (see
    // src/models/Plate.ts — `ownershipDocument` is a plain string ref) —
    // it must derive the right content type from the extension it just
    // wrote, not assume webp.
    const read = await readOwnershipDocument(stored.ref);
    expect(read.contentType).toBe("image/jpeg");
    expect(read.buffer.equals(original)).toBe(true);
  });

  it("saves a validated PNG unprocessed with a real .png extension and correct content type on read-back", async () => {
    const { saveOwnershipDocument, readOwnershipDocument } = await import("@/lib/privateStorage");
    const original = Buffer.from("another-registration-photo");
    const stored = await saveOwnershipDocument(fileOf(original, "istimara.png", "image/png"), TEST_SUBDIR);

    expect(stored.ref).toMatch(new RegExp(`^${TEST_SUBDIR}/[a-f0-9-]+\\.png$`));
    const read = await readOwnershipDocument(stored.ref);
    expect(read.contentType).toBe("image/png");
    expect(read.buffer.equals(original)).toBe(true);
  });

  it("still enforces MIME/size validation before the fallback path is reached", async () => {
    const { saveOwnershipDocument } = await import("@/lib/privateStorage");
    await expect(
      saveOwnershipDocument(fileOf(Buffer.from("x"), "doc.pdf", "application/pdf"), TEST_SUBDIR)
    ).rejects.toThrow();
    await expect(
      saveOwnershipDocument(fileOf(Buffer.alloc(9 * 1024 * 1024), "huge.jpg", "image/jpeg"), TEST_SUBDIR)
    ).rejects.toThrow();
  });

  it("legacy PDF refs still read back as application/pdf (unrelated to the image fallback)", async () => {
    const { readOwnershipDocument } = await import("@/lib/privateStorage");
    // No real PDF file is written in this test — only the extension-based
    // content-type derivation is under test here, and that check happens
    // before the file is read... so use a ref to a file that does exist:
    // reuse one written by the JPEG test above would be ideal, but each
    // `it` is independent — instead assert directly against a real file.
    const { writeFile, mkdir } = await import("node:fs/promises");
    const dir = path.join(PRIVATE_UPLOAD_DIR, TEST_SUBDIR);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "legacy.pdf"), Buffer.from("%PDF-1.4 fake"));

    const read = await readOwnershipDocument(`${TEST_SUBDIR}/legacy.pdf`);
    expect(read.contentType).toBe("application/pdf");
  });
});
