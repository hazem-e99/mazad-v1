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

export default function AdminNewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError } = usePlateLogos();
  const [type, setType] = useState<PlateType>("private");
  const [lettersAr, setLettersAr] = useState("");
  const [lettersEn, setLettersEn] = useState("");
  const [numbers, setNumbers] = useState("");
  const [logoId, setLogoId] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
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
        body: JSON.stringify({ type, lettersAr, lettersEn, numbers, logo: logoId, isVip, isFeatured }),
      });
      push(t("admin.plateCreated"), "success");
      router.push("/admin/plates");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("admin.plateCreateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-(--color-text) mb-6">{t("admin.newPlateTitle")}</h1>
      <Card>
        <CardBody className="flex flex-col gap-6">
          <div className="flex items-center justify-center rounded-(--radius-md) bg-(--color-bg-elevated) p-8">
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
                  className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm"
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
                maxLength={4}
                required
                error={error ?? undefined}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-(--color-text)">
                <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
                {t("admin.plateVipCheckbox")}
              </label>
              <label className="flex items-center gap-2 text-sm text-(--color-text)">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                {t("admin.plateFeaturedCheckbox")}
              </label>
            </div>

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("admin.createPlateButton")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
