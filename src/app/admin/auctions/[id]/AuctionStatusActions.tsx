"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { AuctionStatus } from "@/lib/constants";

export function AuctionStatusActions({ auctionId, status }: { auctionId: string; status: AuctionStatus }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState<"cancel" | "finalize" | null>(null);

  async function cancelAuction() {
    setLoading("cancel");
    try {
      await apiFetch(`/api/auctions/${auctionId}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
      push(t("admin.auctionCancelled"), "success");
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
      await apiFetch(`/api/auctions/${auctionId}/finalize`, { method: "POST" });
      push(t("admin.auctionFinalized"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("admin.auctionFinalizeFailed"), "error");
    } finally {
      setLoading(null);
    }
  }

  if (status !== "live" && status !== "scheduled" && status !== "draft") {
    return <p className="text-sm text-(--color-text-faint)">{t("admin.finalStateNotice")}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-(--color-text-muted)">
        {t("admin.currentStatusLabel")}: {status}
      </span>
      <div className="flex flex-wrap gap-2 ms-auto">
        {status === "live" && (
          <Button variant="gold" size="sm" loading={loading === "finalize"} onClick={finalizeNow}>
            {t("admin.finalizeNowButton")}
          </Button>
        )}
        <Button variant="danger" size="sm" loading={loading === "cancel"} onClick={cancelAuction}>
          {t("admin.cancelAuctionButton")}
        </Button>
      </div>
    </div>
  );
}
