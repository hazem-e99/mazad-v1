"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <Card className="shadow-(--shadow-elevated)">
        <CardBody className="flex flex-col gap-5">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-gold) text-(--color-gold-foreground) font-bold text-xl">
              م
            </span>
            <div>
              <h1 className="text-xl font-bold text-(--color-text)">{t("auth.loginTitle")}</h1>
              <p className="text-sm text-(--color-text-muted) mt-1">{t("auth.loginSubtitle")}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label={t("auth.phone")}
              type="tel"
              inputMode="numeric"
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
            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-1">
              {t("auth.login")}
            </Button>
          </form>

          <p className="text-center text-sm text-(--color-text-muted)">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-(--color-gold) font-medium hover:text-(--color-gold-hover)">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
