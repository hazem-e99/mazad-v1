import { describe, it, expect } from "vitest";
import { normalizeSaudiPhone, buildWhatsAppUrl } from "@/lib/whatsapp";

describe("normalizeSaudiPhone", () => {
  it("normalizes a local 05xxxxxxxx number", () => {
    expect(normalizeSaudiPhone("0501234567")).toBe("966501234567");
  });

  it("normalizes an already-international +9665xxxxxxxx number", () => {
    expect(normalizeSaudiPhone("+966501234567")).toBe("966501234567");
  });

  it("normalizes an international number without the plus sign", () => {
    expect(normalizeSaudiPhone("966501234567")).toBe("966501234567");
  });

  it("normalizes a bare 5xxxxxxxx number (no leading 0 or country code)", () => {
    expect(normalizeSaudiPhone("501234567")).toBe("966501234567");
  });

  it("strips spaces and dashes before normalizing", () => {
    expect(normalizeSaudiPhone("050 123 4567")).toBe("966501234567");
    expect(normalizeSaudiPhone("050-123-4567")).toBe("966501234567");
  });

  it("rejects a number that is too short", () => {
    expect(normalizeSaudiPhone("05012345")).toBeNull();
  });

  it("rejects a number that is too long", () => {
    expect(normalizeSaudiPhone("050123456789")).toBeNull();
  });

  it("rejects a non-Saudi mobile prefix", () => {
    expect(normalizeSaudiPhone("0212345678")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(normalizeSaudiPhone("not-a-phone-number")).toBeNull();
    expect(normalizeSaudiPhone("")).toBeNull();
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a correct wa.me URL with a URL-encoded message", () => {
    const url = buildWhatsAppUrl("0501234567", "مرحبًا، أتواصل بخصوص اللوحة");
    expect(url).not.toBeNull();
    expect(url).toContain("https://wa.me/966501234567?text=");
    expect(url).not.toContain(" ");
    expect(decodeURIComponent(url!.split("text=")[1])).toBe("مرحبًا، أتواصل بخصوص اللوحة");
  });

  it("returns null instead of a broken link for an invalid phone", () => {
    expect(buildWhatsAppUrl("123", "hello")).toBeNull();
  });

  it("URL-encodes special characters in the message", () => {
    const url = buildWhatsAppUrl("0501234567", "plate \"ABC\" & <test>");
    expect(url).not.toContain('"');
    expect(url).not.toContain("<");
    expect(url).not.toContain(" & ");
  });
});
