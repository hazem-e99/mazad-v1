import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 4,
    staticGenerationMinPagesPerWorker: 30,
  },
  // Temporary deployment escape hatch for the short Render test deploy.
  // Full `tsc` currently exceeds local/Render memory during `next build`;
  // keep `npm run lint` and `npm run typecheck` as explicit checks.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // AVIF first, WebP as the fallback: the hero photograph and the ad
    // artwork are the heaviest bytes on the site, and AVIF typically
    // halves WebP again on this kind of dark, low-detail photography.
    // Browsers that support neither fall back to the original file.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
