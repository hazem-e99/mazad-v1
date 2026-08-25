import { describe, it, expect } from "vitest";
import { extensionForMime, mimeForExtension, getImageCapability } from "@/lib/imageProcessor";

describe("extensionForMime", () => {
  it("maps each supported image MIME type to its real extension — never assumes webp", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/webp")).toBe("webp");
  });

  it("falls back to a safe generic extension for an unrecognized MIME type", () => {
    expect(extensionForMime("application/octet-stream")).toBe("bin");
  });
});

describe("mimeForExtension", () => {
  it("is the inverse of extensionForMime for every extension it can produce", () => {
    expect(mimeForExtension("jpg")).toBe("image/jpeg");
    expect(mimeForExtension("png")).toBe("image/png");
    expect(mimeForExtension("webp")).toBe("image/webp");
  });

  it("also accepts the .jpeg spelling and is case-insensitive", () => {
    expect(mimeForExtension("jpeg")).toBe("image/jpeg");
    expect(mimeForExtension("JPG")).toBe("image/jpeg");
    expect(mimeForExtension("WEBP")).toBe("image/webp");
  });

  it("returns undefined for an unknown extension", () => {
    expect(mimeForExtension("bin")).toBeUndefined();
    expect(mimeForExtension("pdf")).toBeUndefined();
  });
});

describe("getImageCapability (this dev/CI host — sharp expected to load normally)", () => {
  it("reports available and hands back a usable sharp constructor", async () => {
    const capability = await getImageCapability();
    expect(capability.available).toBe(true);
    if (capability.available) {
      expect(typeof capability.sharp).toBe("function");
    }
  });
});
