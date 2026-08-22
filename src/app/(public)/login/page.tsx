"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function LoginPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, fieldProps, formError, validate, applyApiError, clearField } = useFormValidation(formRef);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Same schema the API parses — a value the browser accepts can never
    // be one the server then rejects for a different reason.
    const data = validate(schemas.loginSchema, { phone, password });
    if (!data) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        silentErrors: true,
      });
      push(t("auth.loginSuccess"), "success");
      router.push("/");
      router.refresh();
    } catch (err) {
      applyApiError(err);
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
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label={t("auth.phone")}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder="05xxxxxxxx"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearField("phone");
          }}
          required
          autoComplete="tel"
          {...fieldProps("phone")}
        />
        <Input
          label={t("auth.password")}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearField("password");
          }}
          required
          autoComplete="current-password"
          {...fieldProps("password")}
        />
        {formError && (
          <p role="alert" className="text-sm font-medium text-(--color-danger)">
            {formError}
          </p>
        )}
        <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1 w-full">
          {t("auth.login")}
        </Button>
      </form>
    </AuthShell>
  );
}
