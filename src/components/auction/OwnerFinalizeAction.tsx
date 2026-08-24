"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatSar } from "@/lib/format";

interface Props {
  auctionId: string;
  currentPrice: number;
  bidCount: number;
  highestBidderName: string | null;
}

/**
 * The plate owner's own "إنهاء المزاد" action (§ Manual Close) — same
 * confirm-only semantics as the admin's finalize action (POST
 * /api/auctions/[id]/finalize computes the same sold/unsold result either
 * way, never a choice), just rendered on the public auction page and
 * gated by the caller on `isSeller && auction:close_own && status==="live"`.
 */
export function OwnerFinalizeAction({ auctionId, currentPrice, bidCount, highestBidderName }: Props) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const willBeSold = bidCount > 0 && highestBidderName != null;

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function finalizeNow() {
    setLoading(true);
    try {
      await apiFetch(`/api/auctions/${auctionId}/finalize`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      push(t("admin.auctionFinalized"), "success");
      setOpen(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.auctionFinalizeFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {t("admin.finalizeNowButton")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
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
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="gold" size="sm" loading={loading} onClick={finalizeNow}>
                {t("admin.finalizeNowButton")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
