import { writeFile, mkdir, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

// Deliberately OUTSIDE `public/` — nothing under this directory is ever
// served by Next's static file handler. The only way to read a file back
// is the protected route in src/app/api/plates/[id]/ownership-document,
// which authorizes the request before streaming bytes.
const PRIVATE_UPLOAD_DIR = process.env.PRIVATE_UPLOAD_DIR ?? "./private-uploads";

// Image-only going forward — a registration document is a photo of the
// إستمارة, not a scanned PDF. The PDF branch below stays only so any
// already-stored legacy document (uploaded before this restriction) still
// reads back correctly; no new PDF is ever written.
const ALLOWED_DOCUMENT_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export interface StoredDocument {
  /** Opaque reference stored on the Plate document — never a public URL. */
  ref: string;
  contentType: string;
}

/**
 * Stores an ownership/registration document privately. Re-encoded through
 * sharp exactly like the public upload pipeline (strips metadata,
 * normalizes size). The PDF branch below only serves back a legacy
 * document stored before uploads were restricted to images.
 */
export async function saveOwnershipDocument(file: File, subdir: string): Promise<StoredDocument> {
  if (!ALLOWED_DOCUMENT_MIME.has(file.type)) {
    throw new Error("نوع الملف غير مدعوم (يُسمح فقط بصور JPEG أو PNG أو WEBP)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("حجم الملف يتجاوز الحد المسموح به (8 ميجابايت)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(/* turbopackIgnore: true */ PRIVATE_UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const optimized = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();
  const filename = `${crypto.randomUUID()}.webp`;
  await writeFile(path.join(dir, filename), optimized);
  return { ref: `${subdir}/${filename}`, contentType: "image/webp" };
}

export async function readOwnershipDocument(ref: string): Promise<{ buffer: Buffer; contentType: string }> {
  const fullPath = path.join(/* turbopackIgnore: true */ PRIVATE_UPLOAD_DIR, ref);
  const buffer = await readFile(fullPath);
  const contentType = ref.endsWith(".pdf") ? "application/pdf" : "image/webp";
  return { buffer, contentType };
}

export async function deleteOwnershipDocument(ref: string): Promise<void> {
  const fullPath = path.join(/* turbopackIgnore: true */ PRIVATE_UPLOAD_DIR, ref);
  await unlink(fullPath).catch(() => undefined);
}
