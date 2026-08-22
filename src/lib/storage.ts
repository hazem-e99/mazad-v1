import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * Storage is abstracted behind this module so local-disk storage can be
 * swapped for cloud/object storage later without touching callers.
 */
export async function saveImage(file: File, subdir: string): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("نوع الملف غير مدعوم (يُسمح فقط بـ JPEG أو PNG أو WEBP)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("حجم الملف يتجاوز الحد المسموح به (8 ميجابايت)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.webp`;
  // UPLOAD_DIR is intentionally runtime-configurable (spec: swappable
  // storage backend) — opt out of Turbopack's static file-tracing here.
  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const optimized = await sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await writeFile(path.join(dir, filename), optimized);

  return `/uploads/${subdir}/${filename}`;
}

export async function deleteImage(publicPath: string): Promise<void> {
  if (!publicPath.startsWith("/uploads/")) return;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const fullPath = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, relative);
  await unlink(fullPath).catch(() => undefined);
}
