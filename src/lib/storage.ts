import { writeFile, mkdir, unlink, access } from "node:fs/promises";
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

/**
 * Stores an image under a caller-chosen, stable filename instead of a
 * random UUID.
 *
 * Uploads get a UUID because two users uploading `plate.jpg` must not
 * collide. Fixture artwork has the opposite requirement: the seed and the
 * repair script need to write *the same* path every run, so a database row
 * that already references it heals without a rewrite. Kept here rather
 * than writing files directly from the seed so local disk stays swappable
 * for object storage behind this one module.
 */
export async function saveImageAt(source: Buffer, subdir: string, filename: string): Promise<string> {
  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const optimized = await sharp(source)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await writeFile(path.join(dir, filename), optimized);

  return `/uploads/${subdir}/${filename}`;
}

/**
 * Whether the file a stored public path points at is actually present in
 * the configured storage. Stored paths outlive their files more easily
 * than they look: uploads live on local disk, outside git, while the
 * database row referencing them is shared — so a record written by one
 * machine's seed/migration reaches another clone with no artwork behind
 * it. Callers that can regenerate the image use this to detect that case
 * instead of serving a dead <img> to the browser.
 */
export async function imageExists(publicPath: string): Promise<boolean> {
  if (!publicPath.startsWith("/uploads/")) return false;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const root = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR);
  const fullPath = path.resolve(root, relative);
  // `..` segments in a stored path would otherwise let this report on
  // files outside the upload root entirely.
  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) return false;
  return access(fullPath).then(
    () => true,
    () => false
  );
}

export async function deleteImage(publicPath: string): Promise<void> {
  if (!publicPath.startsWith("/uploads/")) return;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const fullPath = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, relative);
  await unlink(fullPath).catch(() => undefined);
}
