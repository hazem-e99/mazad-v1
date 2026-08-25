"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * Bulk moderation action — wipes every message in the (single, global)
 * chat room, not just the ones this page happens to be showing. No
 * `router.refresh()` afterward: the DELETE call already triggers
 * `chat:cleared` over the socket, which LiveChatMessagesFeed listens for
 * directly, so the list empties without a reload for this admin and
 * every other connected viewer at once.
 */
export function ClearChatButton() {
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function clearAll() {
    if (!window.confirm(t("admin.confirmClearChat"))) return;
    setLoading(true);
    try {
      await apiFetch("/api/chat/messages", { method: "DELETE" });
      push(t("admin.chatCleared"), "success");
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={clearAll}
      className="text-(--color-danger) hover:bg-(--color-danger)/10"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {t("admin.clearChatButton")}
    </Button>
  );
}
