"use client";

import { useId, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatSar } from "@/lib/format";
import { statusKey } from "@/lib/auctionStatus";
import type { AuctionStatus } from "@/lib/constants";

interface Props {
  auctionId: string;
  status: AuctionStatus;
  currentPrice: number;
  bidCount: number;
  highestBidderName: string | null;
}

/**
 * Staff auction lifecycle actions. `draft` (§ User-Created Auctions) is a
 * pending user submission — اعتماد transitions it to "scheduled" (the
 * existing draft->scheduled edge in AUCTION_TRANSITIONS; the scheduler
 * picks it up within its next 5s tick if startAt has already passed), رفض
 * reuses the same cancel action already built for a live/scheduled
 * auction. "إنهاء المزاد الآن" confirms the auction's already-computed
 * sold/unsold result early (see finalizeAuction) — it can never invent a
 * different outcome, so the modal is a confirmation with an optional
 * reason, not a choice between results.
 */
export function AuctionStatusActions({ auctionId, status, currentPrice, bidCount, highestBidderName }: Props) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [loading, setLoading] = useState<"cancel" | "approve" | "finalize" | null>(null);
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  async function setStatus(next: "scheduled" | "cancelled", kind: "cancel" | "approve") {
    setLoading(kind);
    try {
      await apiFetch(`/api/auctions/${auctionId}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      push(t(kind === "approve" ? "admin.auctionApproved" : "admin.auctionCancelled"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.auctionCancelFailed"), "error");
    } finally {
      setLoading(null);
    }
  }

  async function finalizeNow() {
    setLoading("finalize");
    try {
      await apiFetch(`/api/auctions/${auctionId}/finalize`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      push(t("admin.auctionFinalized"), "success");
      setConfirmingFinalize(false);
      setReason("");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.auctionFinalizeFailed"), "error");
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    if (!confirmingFinalize) return;
    dialogRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmingFinalize(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmingFinalize]);

  if (status !== "live" && status !== "scheduled" && status !== "draft") {
    return <p className="text-sm text-(--color-text-faint)">{t("admin.finalStateNotice")}</p>;
  }

  const willBeSold = bidCount > 0 && highestBidderName != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-(--color-text-muted)">
        {t("admin.currentStatusLabel")}: {t(statusKey[status])}
      </span>
      <div className="flex flex-wrap gap-2 ms-auto">
        {status === "draft" && (
          <Button variant="gold" size="sm" loading={loading === "approve"} onClick={() => setStatus("scheduled", "approve")}>
            {t("admin.approveAuctionButton")}
          </Button>
        )}
        {status === "live" && (
          <Button variant="gold" size="sm" onClick={() => setConfirmingFinalize(true)}>
            {t("admin.finalizeNowButton")}
          </Button>
        )}
        <Button variant="danger" size="sm" loading={loading === "cancel"} onClick={() => setStatus("cancelled", "cancel")}>
          {t(status === "draft" ? "admin.rejectAuctionButton" : "admin.cancelAuctionButton")}
        </Button>
      </div>

      {confirmingFinalize && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmingFinalize(false);
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-4 outline-none"
          >
            <h3 id={titleId} className="font-semibold text-(--color-text)">
              {t("admin.finalizeNowButton")}
            </h3>

            <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-3 text-sm">
              {willBeSold ? (
                <>
                  <p className="text-(--color-text-muted)">
                    {t("auction.highestBidder")}: <span className="font-semibold text-(--color-text)">{highestBidderName}</span>
                  </p>
                  <p className="tnum mt-1 text-(--color-text-muted)">
                    {t("auction.currentPrice")}: <span className="font-semibold text-(--color-text)">{formatSar(currentPrice, locale)}</span>
                  </p>
                  <p className="mt-2 font-medium text-(--color-sold)">{t("admin.finalizeWillSell")}</p>
                </>
              ) : (
                <p className="font-medium text-(--color-text-muted)">{t("admin.finalizeWillNotSell")}</p>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-(--color-text-muted)">{t("admin.closeReasonLabel")}</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                dir={locale === "ar" ? "rtl" : "ltr"}
                className="rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 py-2 text-sm text-(--color-text)"
              />
            </label>

            <div className="flex items-center gap-2 justify-end mt-1">
              <Button variant="ghost" size="sm" onClick={() => setConfirmingFinalize(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="gold" size="sm" loading={loading === "finalize"} onClick={finalizeNow}>
                {t("admin.finalizeNowButton")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
