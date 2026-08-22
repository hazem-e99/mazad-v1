"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, IdCard } from "lucide-react";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { PLATE_TYPES, plateTypeLabel } from "@/lib/constants";
import type { PlateType } from "@/lib/constants";

/**
 * Adding a plate is three decisions — what it reads, how it looks, and a
 * final check — so it is three steps.
 *
 * The brief sketches a longer flow including pricing, dates and document
 * uploads; those belong to an *auction*, which only staff can create
 * (POST /api/auctions is permission-gated), and POST /api/plates accepts
 * none of them. Adding those steps would mean collecting data the API
 * discards, so the flow stops at what a seller actually submits.
 */
const PREVIEW_PLACEHOLDER = { lettersAr: "أ ب ج", lettersEn: "ABC", numbers: "1234" };

export default function NewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError } = usePlateLogos();

  const [step, setStep] = useState(0);
  const [type, setType] = useState<PlateType>("private");
  const [lettersAr, setLettersAr] = useState("");
  const [lettersEn, setLettersEn] = useState("");
  const [numbers, setNumbers] = useState("");
  const [logoId, setLogoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewLogo = useMemo(
    () => (logoId ? (logos ?? []).find((l) => l._id === logoId) ?? null : null),
    [logoId, logos]
  );

  const Forward = locale === "ar" ? ArrowLeft : ArrowRight;
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  const steps = [
    { key: "info", label: t("pages.stepPlateInfo"), hint: t("pages.stepPlateInfoHint") },
    { key: "look", label: t("pages.stepAppearance"), hint: t("pages.stepAppearanceHint") },
    { key: "review", label: t("pages.stepReview"), hint: t("pages.stepReviewHint") },
  ];

  // Step 1 is the only one that can be incomplete — steps 2 and 3 have
  // defaults for every field.
  const infoComplete = lettersAr.trim() !== "" && lettersEn.trim() !== "" && numbers.trim() !== "";
  const canAdvance = step !== 0 || infoComplete;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < steps.length - 1) {
      if (canAdvance) setStep((s) => s + 1);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/plates", {
        method: "POST",
        body: JSON.stringify({ type, lettersAr, lettersEn, numbers, logo: logoId }),
      });
      push(t("pages.plateSubmitted"), "success");
      router.push("/account/plates");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t("common.error");
      setError(message);
      // A validation failure always concerns a step-1 field, so send the
      // user back to where the fix is instead of showing the error under
      // a review screen with nothing editable on it.
      setStep(0);
      if (err instanceof ApiClientError && err.code === "unauthorized") {
        push(t("auction.mustLoginToBid"), "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mz-container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
          <IdCard className="h-7 w-7 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
          {t("pages.addPlateTitle")}
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">{t("pages.addPlateSubtitle")}</p>
      </div>

      {/* ── Live preview ────────────────────────────────────────────
          Pinned above the form at every step: the plate is what the user
          is actually building, so it updates on each keystroke rather
          than waiting for a review screen. */}
      <div className="mz-edge-gold relative mb-6 flex flex-col items-center gap-3 overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated) px-6 py-10">
        <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-0 opacity-70" />
        <span className="relative text-[11px] font-semibold uppercase tracking-wider text-(--color-text-faint)">
          {t("pages.previewLabel")}
        </span>
        <SaudiPlate
          type={type}
          lettersAr={lettersAr || PREVIEW_PLACEHOLDER.lettersAr}
          lettersEn={lettersEn || PREVIEW_PLACEHOLDER.lettersEn}
          numbers={numbers || PREVIEW_PLACEHOLDER.numbers}
          logo={previewLogo}
          size="lg"
          locale={locale}
          className="relative"
        />
        <span className="relative text-xs text-(--color-text-faint)">{t("pages.livePreviewHint")}</span>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface)"
      >
        <div className="border-b border-(--color-border) p-5 sm:p-6">
          <Stepper steps={steps} current={step} onStepChange={setStep} />
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-(--color-text)">{steps[step].label}</h2>
            <p className="mt-1 text-sm text-(--color-text-muted)">{steps[step].hint}</p>
          </div>

          {step === 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Input
                label={t("pages.lettersArLabel")}
                value={lettersAr}
                onChange={(e) => setLettersAr(e.target.value)}
                required
                dir="rtl"
                placeholder={PREVIEW_PLACEHOLDER.lettersAr}
              />
              <Input
                label={t("pages.lettersEnLabel")}
                value={lettersEn}
                onChange={(e) => setLettersEn(e.target.value.toUpperCase())}
                required
                dir="ltr"
                placeholder={PREVIEW_PLACEHOLDER.lettersEn}
              />
              <Input
                label={t("pages.numbersLabel")}
                value={numbers}
                onChange={(e) => setNumbers(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                maxLength={4}
                required
                dir="ltr"
                placeholder={PREVIEW_PLACEHOLDER.numbers}
                error={error ?? undefined}
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Select
                label={t("pages.plateTypeLabel")}
                value={type}
                onChange={(e) => setType(e.target.value as PlateType)}
              >
                {PLATE_TYPES.map((plateType) => (
                  <option key={plateType} value={plateType}>
                    {plateTypeLabel(plateType, locale)}
                  </option>
                ))}
              </Select>

              <PlateLogoSelect
                label={t("pages.plateLogoLabel")}
                value={logoId}
                onChange={setLogoId}
                logos={logos}
                loadError={loadError}
              />
            </div>
          )}

          {step === 2 && (
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-border) sm:grid-cols-2">
              {[
                { label: t("pages.reviewPlateType"), value: plateTypeLabel(type, locale) },
                { label: t("pages.reviewLetters"), value: `${lettersAr} · ${lettersEn}` },
                { label: t("pages.reviewNumbers"), value: numbers, numeric: true },
                {
                  label: t("pages.reviewLogo"),
                  value: previewLogo
                    ? locale === "en"
                      ? previewLogo.nameEn
                      : previewLogo.nameAr
                    : t("pages.noLogoOption"),
                },
              ].map((row) => (
                <div key={row.label} className="bg-(--color-bg-elevated) p-4">
                  <dt className="text-xs text-(--color-text-faint)">{row.label}</dt>
                  <dd className={"mt-1 font-medium text-(--color-text) " + (row.numeric ? "tnum" : "")}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-(--color-border) bg-black/20 p-5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <Back className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Button>

          <Button type="submit" variant="gold" size="lg" loading={loading} disabled={!canAdvance}>
            {step === steps.length - 1 ? (
              <>
                <Check className="h-4.5 w-4.5" aria-hidden="true" />
                {t("pages.submitPlate")}
              </>
            ) : (
              <>
                {t("common.continue")}
                <Forward className="h-4.5 w-4.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
