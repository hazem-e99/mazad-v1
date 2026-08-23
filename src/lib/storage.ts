import crypto from "node:crypto";
import sharp from "sharp";
import { connectDB } from "@/lib/db";
import { SiteAsset } from "@/models/SiteAsset";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_STORED_BYTES = 5 * 1024 * 1024;

/**
 * All images are stored as documents in MongoDB (the `SiteAsset` model),
 * not as files on local disk — local disk doesn't survive across deploys/
 * clones/instances, while every reader already shares the same database.
 * Callers only ever see the resulting `/api/site-assets/<key>` URL, so
 * this module can change its backing store without touching them.
 */
export async function saveImage(file: File, subdir: string): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("نوع الملف غير مدعوم (يُسمح فقط بـ JPEG أو PNG أو WEBP)");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("حجم الملف يتجاوز الحد المسموح به (8 ميجابايت)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // The declared MIME type is caller-supplied and trivially forged, so the
  // real check is whether sharp can decode the bytes at all. Its own
  // failure text is English and internal ("Input buffer contains
  // unsupported image format"), which is not something to show a user.
  let optimized: Buffer;
  try {
    optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("تعذر قراءة الملف كصورة صالحة، يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP");
  }

  if (optimized.byteLength > MAX_STORED_BYTES) {
    throw new Error("حجم الصورة بعد التحسين كبير جدًا، يرجى اختيار صورة أصغر");
  }

  await connectDB();
  const key = `${crypto.randomUUID()}.webp`;
  await SiteAsset.create({
    key,
    data: optimized,
    contentType: "image/webp",
    originalName: file.name,
    size: optimized.byteLength,
    subdir,
  });

  return `/api/site-assets/${key}`;
}

/**
 * Stores an image under a caller-chosen, stable key instead of a random
 * UUID.
 *
 * Uploads get a UUID because two users uploading `plate.jpg` must not
 * collide. Fixture artwork has the opposite requirement: the seed and the
 * repair script need to write *the same* key every run, so a database row
 * that already references it heals without a rewrite.
 */
export async function saveImageAt(source: Buffer, subdir: string, filename: string): Promise<string> {
  const optimized = await sharp(source)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await connectDB();
  const key = filename.endsWith(".webp") ? filename : `${filename}.webp`;
  await SiteAsset.findOneAndUpdate(
    { key },
    {
      key,
      data: optimized,
      contentType: "image/webp",
      originalName: filename,
      size: optimized.byteLength,
      subdir,
    },
    { upsert: true }
  );

  return `/api/site-assets/${key}`;
}

/** Whether a stored public path still points at an asset present in the database. */
export async function imageExists(publicPath: string | null | undefined): Promise<boolean> {
  if (!publicPath || !publicPath.startsWith("/api/site-assets/")) return false;
  const key = publicPath.replace(/^\/api\/site-assets\//, "");
  await connectDB();
  const count = await SiteAsset.countDocuments({ key }).lean();
  return count > 0;
}

export async function deleteImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/api/site-assets/")) return;
  const key = publicPath.replace(/^\/api\/site-assets\//, "");
  await connectDB();
  await SiteAsset.deleteOne({ key }).catch(() => undefined);
}

/** Fetches a stored asset's bytes for the `/api/site-assets/[id]` serving route. */
export async function getStoredAsset(key: string) {
  await connectDB();
  return SiteAsset.findOne({ key }).select("data contentType").lean<{
    data: Buffer;
    contentType: string;
  } | null>();
}
