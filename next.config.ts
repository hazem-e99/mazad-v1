import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback: the hero photograph and the ad
    // artwork are the heaviest bytes on the site, and AVIF typically
    // halves WebP again on this kind of dark, low-detail photography.
    // Browsers that support neither fall back to the original file.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
