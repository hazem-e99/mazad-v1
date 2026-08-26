"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function ChangePasswordForm() {
  const { t } = useTranslations();
  const push = useToastStore((s) => s.push);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!currentPassword) {
      push(t("validation.passwordRequired"), "error");
      return;
    }

    if (newPassword.length < 8) {
      push(t("validation.passwordTooShort"), "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      push(t("account.passwordsDoNotMatch"), "error");
      return;
    }

    if (currentPassword === newPassword) {
      push(t("account.passwordSameAsCurrent"), "error");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      push(t("account.changePasswordSuccess"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : t("account.changePasswordError"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
      <div className="flex items-start gap-4 p-5 border-b border-(--color-border)">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-gold)/20 bg-(--color-gold-bg) text-(--color-gold)">
          <Lock className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-(--color-text)">{t("account.changePasswordTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
            {t("account.changePasswordSubtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label={t("account.currentPassword")}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={saving}
            required
            autoComplete="current-password"
          />
          <Input
            label={t("account.newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={saving}
            required
            autoComplete="new-password"
          />
          <Input
            label={t("account.confirmPassword")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={saving}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="gold" size="md" loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            <span>{t("account.savePasswordButton")}</span>
          </Button>
        </div>
      </form>
    </section>
  );
}
