"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateDTO } from "@/types/dto";

export function ListingModerationActions({ listing }: { listing: PlateDTO }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function decide(status: "approved" | "rejected", rejectionReason?: string) {
    setLoading(true);
    try {
      await apiFetch(`/api/listings/${listing._id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
      push(status === "approved" ? t("admin.listingApproved") : t("admin.listingRejected"), "success");
      setRejecting(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("admin.rejectionReasonPlaceholder")}
          rows={2}
          className="rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-2 py-1 text-xs text-(--color-text)"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="danger" loading={loading} disabled={!reason.trim()} onClick={() => decide("rejected", reason.trim())}>
            {t("admin.confirmRejectAction")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {listing.moderationStatus === "pending" && (
        <>
          <Button size="sm" variant="gold" loading={loading} onClick={() => decide("approved")}>
            {t("admin.approveAction")}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setRejecting(true)}>
            {t("admin.rejectAction")}
          </Button>
        </>
      )}
      {listing.moderationStatus === "approved" && (
        <Button size="sm" variant="ghost" onClick={() => setRejecting(true)}>
          {t("admin.rejectAction")}
        </Button>
      )}
      {listing.moderationStatus === "approved" && listing.submissionType === "auction_request" && (
        <Link href={`/admin/auctions/new?plateId=${listing._id}`} className="text-sm text-(--color-gold) hover:text-(--color-gold-hover) whitespace-nowrap">
          {t("admin.createAuctionFromRequest")}
        </Link>
      )}
    </div>
  );
}
