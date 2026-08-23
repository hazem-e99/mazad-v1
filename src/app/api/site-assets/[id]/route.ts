import { getSiteAsset } from "@/lib/siteAssetStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]+\.webp$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const asset = await getSiteAsset(id);
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
