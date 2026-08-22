import type { Translate } from "@/lib/validation";

/**
 * Mirrors the limits enforced in src/lib/storage.ts and
 * src/lib/privateStorage.ts. The server remains the authority — this only
 * spares the user a pointless upload round-trip and gives them the reason
 * next to the picker rather than as a failed request.
 */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export type FileKind = "image" | "document";

/** Returns a localized error message, or null when the file is acceptable. */
export function validateUploadFile(
  file: File | null | undefined,
  t: Translate,
  kind: FileKind = "image"
): string | null {
  if (!file) return null;

  const allowed: readonly string[] = kind === "document" ? DOCUMENT_MIME_TYPES : IMAGE_MIME_TYPES;
  if (!allowed.includes(file.type)) {
    return t(kind === "document" ? "validation.documentTypeInvalid" : "validation.fileTypeInvalid");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return t("validation.fileTooLarge", { max: MAX_UPLOAD_MB });
  }
  return null;
}
