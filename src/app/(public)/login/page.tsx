"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function LoginPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) });
      push(t("auth.loginSuccess"), "success");
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t("common.error");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-semibold text-(--color-gold) transition-colors hover:text-(--color-gold-hover)"
          >
            {t("auth.createAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label={t("auth.phone")}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder="05xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
        <Input
          label={t("auth.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          error={error ?? undefined}
        />
        <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1 w-full">
          {t("auth.login")}
        </Button>
      </form>
    </AuthShell>
  );
}
