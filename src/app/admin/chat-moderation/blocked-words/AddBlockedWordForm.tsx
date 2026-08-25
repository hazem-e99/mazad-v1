"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function AddBlockedWordForm() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/api/blocked-words", {
        method: "POST",
        body: JSON.stringify({ word: word.trim() }),
      });
      push(t("admin.blockedWordAdded"), "success");
      setWord("");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Input
        label={t("admin.blockedWordLabel")}
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder={t("admin.blockedWordPlaceholder")}
        maxLength={100}
        className="max-w-xs"
      />
      <Button type="submit" variant="gold" size="md" loading={loading} disabled={!word.trim()}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("admin.addBlockedWordButton")}
      </Button>
    </form>
  );
}
