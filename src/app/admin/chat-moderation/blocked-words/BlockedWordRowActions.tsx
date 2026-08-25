"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { BlockedWordDTO } from "@/types/dto";

export function BlockedWordRowActions({ word }: { word: BlockedWordDTO }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(word.word);
  const [loading, setLoading] = useState(false);

  async function saveWord() {
    if (!value.trim() || value.trim() === word.word) {
      setEditing(false);
      setValue(word.word);
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/api/blocked-words/${word._id}`, {
        method: "PATCH",
        body: JSON.stringify({ word: value.trim() }),
      });
      push(t("admin.blockedWordUpdated"), "success");
      setEditing(false);
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    setLoading(true);
    try {
      await apiFetch(`/api/blocked-words/${word._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !word.isActive }),
      });
      push(word.isActive ? t("admin.blockedWordDeactivated") : t("admin.blockedWordActivated"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.confirmDeleteBlockedWord"))) return;
    setLoading(true);
    try {
      await apiFetch(`/api/blocked-words/${word._id}`, { method: "DELETE" });
      push(t("admin.blockedWordDeleted"), "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
          className="h-9 w-32"
          autoFocus
        />
        <Button variant="ghost" size="sm" loading={loading} onClick={saveWord}>
          {t("common.save")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setValue(word.word);
          }}
        >
          {t("common.cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        {t("admin.editLogoAction")}
      </Button>
      <Button variant="ghost" size="sm" loading={loading} onClick={toggleActive}>
        {word.isActive ? t("admin.deactivateLogoAction") : t("admin.activateLogoAction")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={loading}
        onClick={remove}
        className="text-(--color-danger) hover:bg-(--color-danger)/10"
      >
        {t("admin.deleteLogoAction")}
      </Button>
    </div>
  );
}
