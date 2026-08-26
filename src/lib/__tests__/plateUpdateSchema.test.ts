import { describe, it, expect } from "vitest";
import { buildSchemas, translatorFor } from "@/lib/validation";

// Build schemas with the default Arabic locale so messages are predictable.
const { plateUpdateSchema } = buildSchemas(translatorFor("ar"));

// Valid Saudi-plate Arabic letters (from the official 17-letter set).
// "أ ب ح" → reversed Latin "JBA"
const VALID_LETTERS_AR = "أ ب ح";

describe("plateUpdateSchema — PATCH /api/plates/[id]", () => {
  // ------------------------------------------------------------------
  // 1. No TypeError from .partial()
  // ------------------------------------------------------------------
  it("is a valid Zod schema (no TypeError thrown on construction)", () => {
    // If plateUpdateSchema were built with plateSchema.partial() this line
    // itself would throw "c.partial is not a function" at module evaluation.
    expect(typeof plateUpdateSchema.parse).toBe("function");
  });

  // ------------------------------------------------------------------
  // 2. Fully-empty body — every field is optional in a PATCH.
  //    isVip/isFeatured carry .default(false) so they appear in the output
  //    even when not supplied; that is correct and intentional.
  // ------------------------------------------------------------------
  it("accepts an empty object (all fields optional)", () => {
    const result = plateUpdateSchema.parse({});
    // The schema applies defaults; PATCH callers can send {} and get no error.
    expect(result).not.toBeNull();
    // Default booleans should be present but not cause a parse failure.
    expect(result.isVip).toBe(false);
    expect(result.isFeatured).toBe(false);
  });

  // ------------------------------------------------------------------
  // 3. PATCH with only `notes`
  // ------------------------------------------------------------------
  it("accepts a body with only notes", () => {
    const result = plateUpdateSchema.parse({ notes: "Test note" });
    expect(result.notes).toBe("Test note");
    // No lettersEn derivation triggered — lettersAr absent
    expect(result.lettersEn).toBeUndefined();
  });

  // ------------------------------------------------------------------
  // 4. PATCH with `lettersAr` → derives `lettersEn`
  // ------------------------------------------------------------------
  it("derives lettersEn from lettersAr when lettersAr is supplied", () => {
    // "أ ب ح" → reversed → "JBA" via deriveLettersEn
    const result = plateUpdateSchema.parse({ lettersAr: VALID_LETTERS_AR });
    expect(result.lettersAr).toBe(VALID_LETTERS_AR);
    expect(typeof result.lettersEn).toBe("string");
    expect(result.lettersEn!.length).toBeGreaterThan(0);
    // Derivation reverses the Arabic order, so "أ ب ح" → "J B A" → "JBA"
    expect(result.lettersEn).toBe("JBA");
  });

  it("does not attach lettersEn when lettersAr is absent", () => {
    const result = plateUpdateSchema.parse({ notes: "no letters" });
    expect("lettersEn" in result).toBe(false);
  });

  // ------------------------------------------------------------------
  // 5. PATCH with `logo`
  // ------------------------------------------------------------------
  it("accepts a valid ObjectId string for logo", () => {
    const logoId = "a".repeat(24); // 24 hex chars
    const result = plateUpdateSchema.parse({ logo: logoId });
    expect(result.logo).toBe(logoId);
  });

  it("accepts null for logo (explicit clear)", () => {
    const result = plateUpdateSchema.parse({ logo: null });
    expect(result.logo).toBeNull();
  });

  it("rejects a logo that is not a valid ObjectId", () => {
    expect(() => plateUpdateSchema.parse({ logo: "not-an-id" })).toThrow();
  });

  // ------------------------------------------------------------------
  // 6. Invalid payload — schema-level rejection
  // ------------------------------------------------------------------
  it("rejects an invalid type value", () => {
    expect(() => plateUpdateSchema.parse({ type: "invalid_type" })).toThrow();
  });

  it("rejects notes that exceed 500 characters", () => {
    expect(() => plateUpdateSchema.parse({ notes: "x".repeat(501) })).toThrow();
  });

  it("rejects lettersAr containing characters outside the Saudi plate alphabet", () => {
    // "ز" and "ض" are not in the 17-letter plate set, "INVALID" clearly isn't
    expect(() => plateUpdateSchema.parse({ lettersAr: "ز ض" })).toThrow();
  });

  // ------------------------------------------------------------------
  // 7. withDerivedLettersEn is preserved — transform still fires
  // ------------------------------------------------------------------
  it("transform fires and merges derived lettersEn into the output object", () => {
    const result = plateUpdateSchema.parse({
      type: "private",
      lettersAr: VALID_LETTERS_AR,
      numbers: "123",
    });
    // withDerivedLettersEn must have run
    expect(result).toHaveProperty("lettersEn");
    expect(result.lettersEn).not.toBe("");
  });
});
