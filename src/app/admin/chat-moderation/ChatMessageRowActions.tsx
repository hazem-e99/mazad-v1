"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function DeleteChatMessageButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(t("admin.confirmDeleteChatMessage"))) return;
    setLoading(true);
    try {
      await apiFetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
      push(t("admin.chatMessageDeleted"), "success");
      router.refresh();
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
      onClick={remove}
      className="text-(--color-danger) hover:bg-(--color-danger)/10"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      {t("admin.deleteMessageAction")}
    </Button>
  );
}
