"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function BlockUserButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isBlocked && !window.confirm(t("admin.confirmBlockUserFromChat"))) return;
    setLoading(true);
    try {
      await apiFetch(`/api/users/${userId}/chat-block`, {
        method: "PATCH",
        body: JSON.stringify({ chatBlocked: !isBlocked }),
      });
      push(isBlocked ? t("admin.userUnblockedFromChat") : t("admin.userBlockedFromChat"), "success");
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
      onClick={toggle}
      className={isBlocked ? undefined : "text-(--color-danger) hover:bg-(--color-danger)/10"}
    >
      {isBlocked ? <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Ban className="h-3.5 w-3.5" aria-hidden="true" />}
      {isBlocked ? t("admin.unblockFromChatAction") : t("admin.blockFromChatAction")}
    </Button>
  );
}
