import { describe, it, expect } from "vitest";
import { buildSchemas, translatorFor } from "@/lib/validation";

const { changePasswordSchema } = buildSchemas(translatorFor("ar"));

describe("changePasswordSchema", () => {
  it("accepts valid change password payload", () => {
    const result = changePasswordSchema.parse({
      currentPassword: "OldPassword123!",
      newPassword: "NewSecretPassword456!",
      confirmPassword: "NewSecretPassword456!",
    });
    expect(result.newPassword).toBe("NewSecretPassword456!");
  });

  it("rejects when new password is too short (< 8 chars)", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "OldPassword123!",
        newPassword: "short",
        confirmPassword: "short",
      })
    ).toThrow();
  });

  it("rejects when confirm password does not match new password", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "OldPassword123!",
        newPassword: "NewSecretPassword456!",
        confirmPassword: "DifferentPassword456!",
      })
    ).toThrow();
  });

  it("rejects when new password is identical to current password", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "SamePassword123!",
        newPassword: "SamePassword123!",
        confirmPassword: "SamePassword123!",
      })
    ).toThrow();
  });

  it("rejects when current password is empty", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "",
        newPassword: "NewSecretPassword456!",
        confirmPassword: "NewSecretPassword456!",
      })
    ).toThrow();
  });
});
