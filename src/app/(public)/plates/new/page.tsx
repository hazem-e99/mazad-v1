"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { PLATE_TYPES, plateTypeLabel } from "@/lib/constants";
import type { PlateType } from "@/lib/constants";

export default function NewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError } = usePlateLogos();
  const [type, setType] = useState<PlateType>("private");
  const [lettersAr, setLettersAr] = useState("");
  const [lettersEn, setLettersEn] = useState("");
  const [numbers, setNumbers] = useState("");
  const [logoId, setLogoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewLogo = logoId ? (logos ?? []).find((l) => l._id === logoId) ?? null : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/plates", {
        method: "POST",
        body: JSON.stringify({ type, lettersAr, lettersEn, numbers, logo: logoId }),
      });
      push(t("pages.plateSubmitted"), "success");
      router.push("/");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t("common.error");
      setError(message);
      if (err instanceof ApiClientError && err.code === "unauthorized") {
        push(t("auction.mustLoginToBid"), "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-(--color-text) mb-1">{t("pages.addPlateTitle")}</h1>
      <p className="text-sm text-(--color-text-muted) mb-6">{t("pages.addPlateSubtitle")}</p>

      <Card>
        <CardBody className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 rounded-(--radius-md) bg-(--color-bg-elevated) p-8">
            <span className="text-xs font-medium text-(--color-text-faint) uppercase tracking-wide">{t("pages.previewLabel")}</span>
            <PlateRenderer
              type={type}
              lettersAr={lettersAr || "أ ب ج"}
              lettersEn={lettersEn || "ABC"}
              numbers={numbers || "1234"}
              logo={previewLogo}
              size="md"
              locale={locale}
            />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.plateTypeLabel")}</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PlateType)}
                  className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
                >
                  {PLATE_TYPES.map((plateType) => (
                    <option key={plateType} value={plateType}>
                      {plateTypeLabel(plateType, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <PlateLogoSelect
                label={t("pages.plateLogoLabel")}
                value={logoId}
                onChange={setLogoId}
                logos={logos}
                loadError={loadError}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label={t("pages.lettersArLabel")} value={lettersAr} onChange={(e) => setLettersAr(e.target.value)} required />
              <Input label={t("pages.lettersEnLabel")} value={lettersEn} onChange={(e) => setLettersEn(e.target.value)} required />
              <Input
                label={t("pages.numbersLabel")}
                value={numbers}
                onChange={(e) => setNumbers(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                maxLength={4}
                required
                error={error ?? undefined}
              />
            </div>

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("pages.submitPlate")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
