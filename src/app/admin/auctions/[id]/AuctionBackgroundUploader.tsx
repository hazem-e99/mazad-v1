"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function AuctionBackgroundUploader({
  auctionId,
  currentImage,
}: {
  auctionId: string;
  currentImage: string | null;
}) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  async function uploadAndSave() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subdir", "auction-backgrounds");
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData, credentials: "same-origin" });
      const uploadBody = await uploadRes.json();
      if (!uploadRes.ok || !uploadBody.ok) {
        throw new ApiClientError(uploadBody.code ?? "upload_failed", uploadBody.message ?? t("admin.backgroundUploadFailed"));
      }

      await apiFetch(`/api/auctions/${auctionId}`, {
        method: "PATCH",
        body: JSON.stringify({ backgroundImage: uploadBody.data.url }),
      });

      push(t("admin.backgroundSaved"), "success");
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("admin.backgroundUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function removeBackground() {
    setUploading(true);
    try {
      await apiFetch(`/api/auctions/${auctionId}`, { method: "PATCH", body: JSON.stringify({ backgroundImage: null }) });
      push(t("admin.backgroundRemoved"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.backgroundRemoveFailed"), "error");
    } finally {
      setUploading(false);
    }
  }

  const displayImage = preview ?? currentImage;

  return (
    <div className="flex flex-col gap-4">
      {displayImage && (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-(--radius-md) bg-(--color-bg-elevated)">
          <Image src={displayImage} alt={t("admin.backgroundAlt")} fill className="object-cover" unoptimized={Boolean(preview)} />
        </div>
      )}

      <label className="flex flex-col gap-1.5 max-w-md">
        <span className="text-sm font-medium text-(--color-text)">
          {currentImage ? t("admin.replaceBackground") : t("admin.chooseBackground")}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          capture="environment"
          className="text-sm text-(--color-text-muted) file:me-3 file:rounded-(--radius-sm) file:border-0 file:bg-(--color-surface-hover) file:px-3 file:py-1.5 file:text-sm"
        />
      </label>

      {error && <p className="text-sm text-(--color-danger)">{error}</p>}

      <div className="flex items-center gap-2">
        <Button variant="gold" size="sm" loading={uploading} disabled={!file} onClick={uploadAndSave}>
          {t("admin.uploadAndSave")}
        </Button>
        {currentImage && !file && (
          <Button variant="ghost" size="sm" loading={uploading} onClick={removeBackground}>
            {t("admin.removeCurrentBackground")}
          </Button>
        )}
      </div>
    </div>
  );
}
