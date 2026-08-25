import { describe, it, expect } from "vitest";
import { normalizeToken, tokenize } from "@/lib/chatModeration";

describe("normalizeToken", () => {
  it("lowercases Latin text", () => {
    expect(normalizeToken("HELLO")).toBe("hello");
  });

  it("strips Arabic tashkeel (diacritics)", () => {
    // "مُحَمَّد" with fatha/damma/shadda marks should normalize the same as
    // the bare letters once the shadda's doubled consonant is also
    // collapsed by the stretched-run pass.
    expect(normalizeToken("مُحَمَّد")).toBe(normalizeToken("محمد"));
  });

  it("strips tatweel elongation", () => {
    expect(normalizeToken("سسلاـــم")).not.toContain("ـ");
  });

  it("unifies Arabic letter variants", () => {
    expect(normalizeToken("أحمد")).toBe(normalizeToken("احمد"));
    expect(normalizeToken("إحمد")).toBe(normalizeToken("احمد"));
    expect(normalizeToken("مكتبة")).toBe(normalizeToken("مكتبه"));
  });

  it("collapses runs of 3+ repeated characters (stretching evasion)", () => {
    expect(normalizeToken("fuuuuck")).toBe("fuck");
    expect(normalizeToken("كسسسسم")).toBe(normalizeToken("كسم"));
  });

  it("does not collapse ordinary double letters", () => {
    // A run of exactly 2 is left alone — "committee" must not become
    // "comite" (that would be a much bigger false-positive surface).
    expect(normalizeToken("committee")).toBe("committee");
  });

  it("applies Arabizi digit substitution only to Arabic-letter tokens", () => {
    expect(normalizeToken("خ7ر")).toBe(normalizeToken("خحر"));
    // A pure-number token must not be reinterpreted as Arabic.
    expect(normalizeToken("2026")).toBe("2026");
  });

  it("applies light Latin leetspeak only to non-Arabic tokens", () => {
    expect(normalizeToken("sh1t")).toBe("shit");
    expect(normalizeToken("@ss")).toBe("ass");
  });
});

describe("tokenize", () => {
  it("splits on whitespace and punctuation, discarding both", () => {
    expect(tokenize("hello,   world!!")).toEqual(["hello", "world"]);
  });

  it("collapses extra/repeated spaces for free (no separate step needed)", () => {
    expect(tokenize("كلمة     سيئة")).toEqual(["كلمة", "سيئة"]);
  });

  it("keeps Arabic and Latin runs as separate tokens", () => {
    expect(tokenize("مرحبا hello 2026")).toEqual(["مرحبا", "hello", "2026"]);
  });

  it("ignores HTML-tag-shaped input as plain punctuation-separated tokens", () => {
    expect(tokenize("<script>alert(1)</script>")).toEqual(["script", "alert", "1", "script"]);
  });
});
