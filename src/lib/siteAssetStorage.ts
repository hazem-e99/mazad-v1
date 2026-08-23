import crypto from "node:crypto";
import sharp from "sharp";
import { connectDB } from "@/lib/db";
import { SiteAsset } from "@/models/SiteAsset";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_STORED_BYTES = 5 * 1024 * 1024;

export async function saveSiteAsset(file: File): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, or WebP.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is larger than the 8MB limit.");
  }

  const source = Buffer.from(await file.arrayBuffer());
  let optimized: Buffer;

  try {
    optimized = await sharp(source)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Could not read this file as a valid image.");
  }

  if (optimized.byteLength > MAX_STORED_BYTES) {
    throw new Error("Optimized image is too large. Try a smaller image.");
  }

  await connectDB();
  const key = `${crypto.randomUUID()}.webp`;
  await SiteAsset.create({
    key,
    data: optimized,
    contentType: "image/webp",
    originalName: file.name,
    size: optimized.byteLength,
  });

  return `/api/site-assets/${key}`;
}

export async function getSiteAsset(key: string) {
  await connectDB();
  return SiteAsset.findOne({ key }).select("data contentType").lean<{
    data: Buffer;
    contentType: string;
  } | null>();
}
