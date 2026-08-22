export const PLATE_IMAGE_ASSETS = [
  "/images/License1.png",
  "/images/License2.png",
  "/images/License3.png",
  "/images/License4.png",
  "/images/License5.png",
] as const;

export function getPlateImageAsset(letters: string, numbers: string) {
  const seed = `${letters}-${numbers}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return PLATE_IMAGE_ASSETS[hash % PLATE_IMAGE_ASSETS.length];
}
