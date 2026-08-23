import { getStoredAsset } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]+\.webp$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const asset = await getStoredAsset(id);
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  // `.lean()` hands back the raw driver value for a Buffer path, which is a
  // BSON `Binary` wrapper (its bytes live at `.buffer`), not a real Buffer —
  // wrapping that directly in a Uint8Array silently yields zero bytes.
  const bytes = Buffer.isBuffer(asset.data)
    ? asset.data
    : Buffer.from((asset.data as unknown as { buffer: Buffer }).buffer);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": asset.contentType || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
