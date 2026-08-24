"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { AuctionStatusBadge } from "@/components/auction/AuctionStatusBadge";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { BackgroundStatus, AuctionStatus } from "@/lib/constants";
import type { PlateDTO } from "@/types/dto";

interface Props {
  auctionId: string;
  auctionStatus: AuctionStatus;
  plate: PlateDTO;
  currentImage: string | null;
  currentStatus: BackgroundStatus | null;
  currentRejectionReason: string | null;
}

const statusTone: Record<BackgroundStatus, "scheduled" | "sold" | "unsold" | "neutral"> = {
  pending: "scheduled",
  approved: "sold",
  rejected: "unsold",
  disabled: "neutral",
};

/**
 * Lets the plate owner upload a custom background for their own auction's
 * details page (§ Custom Auction Background). Reuses the same upload
 * mechanics as the admin's AuctionBackgroundUploader (/api/uploads,
 * subdir "auction-backgrounds", image-only) but hits the owner-permitted
 * branch of PATCH /api/auctions/[id] instead of requiring staff — that
 * route re-derives ownership from the DB itself, this component's job is
 * only to present the flow, not to gate access.
 */
export function OwnerAuctionBackgroundUploader({ auctionId, auctionStatus, plate, currentImage, currentStatus, currentRejectionReason }: Props) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel: Record<BackgroundStatus, string> = {
    pending: t("admin.backgroundStatusPending"),
    approved: t("admin.backgroundStatusApproved"),
    rejected: t("admin.backgroundStatusRejected"),
    disabled: t("admin.backgroundStatusDisabled"),
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  async function uploadAndSave() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subdir", "auction-backgrounds");
      const uploadData = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: formData });

      await apiFetch(`/api/auctions/${auctionId}`, {
        method: "PATCH",
        body: JSON.stringify({ backgroundImage: uploadData.url }),
      });

      push(t("pages.backgroundSubmittedForReview"), "success");
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("admin.backgroundUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  const previewImage = preview ?? currentImage;

  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-(--color-text)">{t("pages.auctionBackgroundHeader")}</h2>
      <p className="mt-1 text-xs text-(--color-text-muted)">{t("pages.auctionBackgroundDescription")}</p>

      {currentStatus && !preview && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[currentStatus]}>{statusLabel[currentStatus]}</Badge>
          {currentStatus === "rejected" && currentRejectionReason && (
            <span className="text-xs text-(--color-danger)">
              {t("pages.rejectionReasonLabel")}: {currentRejectionReason}
            </span>
          )}
        </div>
      )}

      <label
        htmlFor="auction-background-input"
        className="relative mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) p-4 text-center transition-colors hover:border-(--color-gold)/50"
      >
        <Upload className="h-6 w-6 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
        <span className="text-sm font-medium text-(--color-text)">{file ? file.name : t("pages.uploadBackgroundCta")}</span>
        <input
          id="auction-background-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
      <p className="mt-2 text-xs text-(--color-text-faint)">{t("pages.auctionBackgroundHelper")}</p>
      {error && <p className="mt-2 text-sm text-(--color-danger)">{error}</p>}

      {previewImage && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-(--color-text-faint)">{t("pages.backgroundPreviewLabel")}</p>
          <div
            className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-cover bg-center px-4 py-8"
            style={{ backgroundImage: `url(${previewImage})` }}
          >
            <span className="absolute inset-0 bg-black/55" aria-hidden="true" />
            <div className="relative">
              <AuctionStatusBadge status={auctionStatus} />
            </div>
            <div className="relative">
              <SaudiPlate
                type={plate.type}
                usageType={plate.usageType}
                shape={plate.shape}
                classification={plate.classification}
                lettersAr={plate.lettersAr}
                lettersEn={plate.lettersEn}
                numbers={plate.numbers}
                logo={plate.logo}
                size="sm"
                locale={locale}
              />
            </div>
          </div>
        </div>
      )}

      {file && (
        <div className="mt-4">
          <Button variant="gold" size="sm" loading={uploading} onClick={uploadAndSave}>
            {t("common.save")}
          </Button>
        </div>
      )}
    </section>
  );
}
