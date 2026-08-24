"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { BACKGROUND_TRANSITIONS, type BackgroundStatus } from "@/lib/constants";

const statusTone: Record<BackgroundStatus, "scheduled" | "sold" | "unsold" | "neutral"> = {
  pending: "scheduled",
  approved: "sold",
  rejected: "unsold",
  disabled: "neutral",
};

/**
 * Admin review for a plate owner's (or staff's own) auction-background
 * upload — same approve/reject-with-reason pattern as
 * ListingModerationActions.tsx, over BACKGROUND_TRANSITIONS instead of
 * MODERATION_TRANSITIONS. `disabled` is offered as just another
 * transition target from "approved", not a separate control.
 */
export function AuctionBackgroundModerationActions({
  auctionId,
  status,
  rejectionReason,
}: {
  auctionId: string;
  status: BackgroundStatus | null;
  rejectionReason: string | null;
}) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabel: Record<BackgroundStatus, string> = {
    pending: t("admin.backgroundStatusPending"),
    approved: t("admin.backgroundStatusApproved"),
    rejected: t("admin.backgroundStatusRejected"),
    disabled: t("admin.backgroundStatusDisabled"),
  };

  async function decide(next: BackgroundStatus, nextReason?: string) {
    setLoading(true);
    try {
      await apiFetch(`/api/auctions/${auctionId}/background/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, rejectionReason: nextReason }),
      });
      push(
        next === "approved"
          ? t("admin.backgroundApproved")
          : next === "rejected"
            ? t("admin.backgroundRejectedToast")
            : t("admin.backgroundDisabledToast"),
        "success"
      );
      setRejecting(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  if (!status) return null;

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("admin.rejectionReasonPlaceholder")}
          rows={2}
          dir={locale === "ar" ? "rtl" : "ltr"}
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

  const allowed = BACKGROUND_TRANSITIONS[status] ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
        {status === "rejected" && rejectionReason && (
          <span className="text-xs text-(--color-danger)">
            {t("pages.rejectionReasonLabel")}: {rejectionReason}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {allowed.includes("approved") && (
          <Button size="sm" variant="gold" loading={loading} onClick={() => decide("approved")}>
            {t("admin.approveBackgroundAction")}
          </Button>
        )}
        {allowed.includes("rejected") && (
          <Button size="sm" variant={status === "pending" ? "danger" : "ghost"} onClick={() => setRejecting(true)}>
            {t("admin.rejectBackgroundAction")}
          </Button>
        )}
        {allowed.includes("disabled") && (
          <Button size="sm" variant="ghost" loading={loading} onClick={() => decide("disabled")}>
            {t("admin.disableBackgroundAction")}
          </Button>
        )}
      </div>
    </div>
  );
}
