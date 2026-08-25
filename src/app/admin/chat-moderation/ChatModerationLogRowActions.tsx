"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { ChatModerationLogDTO } from "@/types/dto";

export function ChatModerationLogRowActions({ log }: { log: ChatModerationLogDTO }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    try {
      await apiFetch(`/api/chat-moderation-logs/${log._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: log.status === "pending" ? "reviewed" : "pending" }),
      });
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" loading={loading} onClick={toggleStatus}>
      {log.status === "pending" ? t("admin.markReviewedAction") : t("admin.markPendingAction")}
    </Button>
  );
}
