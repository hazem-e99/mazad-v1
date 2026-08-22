"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, Gavel, IdCard, Store, Upload } from "lucide-react";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { usePlateCategories } from "@/hooks/usePlateCategories";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";
import {
  PLATE_TYPES,
  plateTypeLabel,
  PLATE_CLASSIFICATIONS,
  plateClassificationLabel,
  USAGE_TYPES,
  usageTypeLabel,
  PLATE_SHAPES,
  plateShapeLabel,
  PLATE_SIZES,
  plateSizeLabel,
  SUBMISSION_TYPES,
} from "@/lib/constants";
import type { PlateType, PlateClassification, UsageType, PlateShape, PlateSize, SubmissionType } from "@/lib/constants";

const PREVIEW_PLACEHOLDER = { lettersAr: "أ ب ج", lettersEn: "ABC", numbers: "1234" };

export default function NewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError: logosLoadError } = usePlateLogos();
  const { categories, loadError: categoriesLoadError } = usePlateCategories();

  const [step, setStep] = useState(0);
  const [submissionType, setSubmissionType] = useState<SubmissionType | null>(null);

  const [type, setType] = useState<PlateType>("private");
  const [lettersAr, setLettersAr] = useState("");
  const [lettersEn, setLettersEn] = useState("");
  const [numbers, setNumbers] = useState("");
  const [logoId, setLogoId] = useState<string | null>(null);
  const [classification, setClassification] = useState<PlateClassification | "">("");
  const [usageType, setUsageType] = useState<UsageType | "">("");
  const [shape, setShape] = useState<PlateShape | "">("");
  const [size, setSize] = useState<PlateSize | "">("");
  const [categoryId, setCategoryId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [snapchat, setSnapchat] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewLogo = useMemo(
    () => (logoId ? (logos ?? []).find((l) => l._id === logoId) ?? null : null),
    [logoId, logos]
  );
  const selectedCategory = useMemo(
    () => (categoryId ? (categories ?? []).find((c) => c._id === categoryId) ?? null : null),
    [categoryId, categories]
  );

  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const Forward = locale === "ar" ? ArrowLeft : ArrowRight;
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  const steps = [
    { key: "listing", label: t("pages.listingDetailsHeader"), hint: t("pages.howToListQuestion") },
    { key: "plate", label: t("pages.stepPlateInfo"), hint: t("pages.stepPlateInfoHint") },
    { key: "media", label: t("pages.plateImageHeader"), hint: t("pages.uploadPlatePhotoHint") },
    { key: "review", label: t("pages.stepReview"), hint: t("pages.stepReviewHint") },
  ];

  const stepComplete =
    step === 0
      ? Boolean(
          submissionType &&
            title.trim() &&
            contactPhone.trim() &&
            (submissionType !== "marketplace" || (price.trim() && Number(price) > 0))
        )
      : step === 1
        ? Boolean(lettersAr.trim() && lettersEn.trim() && numbers.trim())
        : step === 2
          ? Boolean(imageFile)
          : true;

  function validationStep() {
    if (!submissionType) return { step: 0, message: t("pages.chooseSubmissionTypeFirst") };
    if (!title.trim() || !contactPhone.trim()) return { step: 0, message: t("common.error") };
    if (submissionType === "marketplace" && (!price.trim() || Number(price) <= 0)) return { step: 0, message: t("common.error") };
    if (!lettersAr.trim() || !lettersEn.trim() || !numbers.trim()) return { step: 1, message: t("common.error") };
    if (!imageFile) return { step: 2, message: t("pages.plateImageRequired") };
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (step < steps.length - 1) {
      if (stepComplete) setStep((s) => s + 1);
      return;
    }

    const invalid = validationStep();
    if (invalid) {
      setError(invalid.message);
      setStep(invalid.step);
      return;
    }

    setLoading(true);
    try {
      const imageForm = new FormData();
      imageForm.append("file", imageFile!);
      imageForm.append("subdir", "plates");
      const imageRes = await fetch("/api/uploads", { method: "POST", body: imageForm, credentials: "same-origin" });
      const imageBody = await imageRes.json();
      if (!imageRes.ok || !imageBody.ok) throw new ApiClientError(imageBody.code ?? "upload_failed", imageBody.message ?? t("common.error"));

      let ownershipDocument: string | undefined;
      if (docFile) {
        const docForm = new FormData();
        docForm.append("file", docFile);
        const docRes = await fetch("/api/uploads/ownership-document", { method: "POST", body: docForm, credentials: "same-origin" });
        const docBody = await docRes.json();
        if (!docRes.ok || !docBody.ok) throw new ApiClientError(docBody.code ?? "upload_failed", docBody.message ?? t("common.error"));
        ownershipDocument = docBody.data.ref;
      }

      await apiFetch("/api/listings", {
        method: "POST",
        body: JSON.stringify({
          type,
          lettersAr,
          lettersEn,
          numbers,
          logo: logoId,
          classification: classification || null,
          usageType: usageType || null,
          shape: shape || null,
          size: size || null,
          category: categoryId || null,
          title,
          description: description || undefined,
          price: submissionType === "marketplace" ? Number(price) : null,
          image: imageBody.data.url,
          ownershipDocument,
          contactPhone,
          contactEmail: contactEmail || undefined,
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
          snapchat: snapchat || undefined,
          submissionType,
        }),
      });

      push(t("pages.plateSubmitted"), "success");
      router.push("/my-listings");
      router.refresh();
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
    <div className="mz-container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
          <IdCard className="h-7 w-7 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
          {t("pages.addPlateTitle")}
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">{t("pages.addPlateSubtitle")}</p>
      </div>

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

      <form onSubmit={onSubmit} noValidate className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface)">
        <div className="border-b border-(--color-border) p-5 sm:p-6">
          <Stepper steps={steps} current={step} onStepChange={setStep} />
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-(--color-text)">{steps[step].label}</h2>
            <p className="mt-1 text-sm text-(--color-text-muted)">{steps[step].hint}</p>
          </div>

          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUBMISSION_TYPES.map((option) => {
                  const selected = submissionType === option;
                  const Icon = option === "marketplace" ? Store : Gavel;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSubmissionType(option)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-32 flex-col gap-3 rounded-(--radius-lg) border p-4 text-start transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                        selected
                          ? "border-(--color-gold) bg-(--color-gold-tint) text-(--color-text)"
                          : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-text-muted) hover:border-(--color-gold)/50"
                      )}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <Icon className="h-5 w-5 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                        {selected && <Check className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />}
                      </span>
                      <span className="font-semibold text-(--color-text)">
                        {option === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest")}
                      </span>
                      <span className="text-xs leading-relaxed text-(--color-text-faint)">
                        {option === "marketplace" ? t("pages.submissionTypeMarketplaceHint") : t("pages.submissionTypeAuctionRequestHint")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Input label={t("pages.titleLabel")} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} />
              <Textarea
                label={t("pages.descriptionLabel")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {submissionType === "marketplace" && (
                  <Input
                    label={t("pages.askingPriceLabel")}
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={1}
                    required
                  />
                )}
                <Input
                  label={t("pages.contactPhoneLabel")}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                />
                <Input label={t("pages.contactEmailLabel")} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label={t("pages.instagramLabel")} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                <Input label={t("pages.tiktokLabel")} value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
                <Input label={t("pages.snapchatLabel")} value={snapchat} onChange={(e) => setSnapchat(e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
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
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select label={t("pages.plateTypeLabel")} value={type} onChange={(e) => setType(e.target.value as PlateType)}>
                  {PLATE_TYPES.map((plateType) => (
                    <option key={plateType} value={plateType}>
                      {plateTypeLabel(plateType, locale)}
                    </option>
                  ))}
                </Select>
                <PlateLogoSelect label={t("pages.plateLogoLabel")} value={logoId} onChange={setLogoId} logos={logos} loadError={logosLoadError} />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label={t("pages.classificationLabel")}
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as PlateClassification | "")}
                >
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_CLASSIFICATIONS.map((item) => (
                    <option key={item} value={item}>
                      {plateClassificationLabel(item, locale)}
                    </option>
                  ))}
                </Select>
                <Select label={t("pages.usageTypeLabel")} value={usageType} onChange={(e) => setUsageType(e.target.value as UsageType | "")}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {USAGE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {usageTypeLabel(item, locale)}
                    </option>
                  ))}
                </Select>
                <Select label={t("pages.shapeLabel")} value={shape} onChange={(e) => setShape(e.target.value as PlateShape | "")}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_SHAPES.map((item) => (
                    <option key={item} value={item}>
                      {plateShapeLabel(item, locale)}
                    </option>
                  ))}
                </Select>
                <Select label={t("pages.sizeLabel")} value={size} onChange={(e) => setSize(e.target.value as PlateSize | "")}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_SIZES.map((item) => (
                    <option key={item} value={item}>
                      {plateSizeLabel(item, locale)}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                label={t("pages.categoryLabel")}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categoriesLoadError}
              >
                <option value="">{t("pages.notSpecified")}</option>
                {(categories ?? []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {locale === "en" ? category.nameEn : category.nameAr}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.85fr]">
              <label
                htmlFor="plate-image-input"
                className="relative flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-(--radius-lg) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) p-6 text-center transition-colors hover:border-(--color-gold)/50"
              >
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                    <span className="text-sm font-medium text-(--color-text)">{t("pages.uploadPlatePhotoHint")}</span>
                    <span className="text-xs text-(--color-text-faint)">{t("pages.plateImageRequired")}</span>
                  </>
                )}
                <input
                  id="plate-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                  required
                />
              </label>

              <div className="flex flex-col justify-between gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-5">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-(--color-text)">
                    <FileText className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                    {t("pages.ownershipDocumentLabel")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-(--color-text-muted)">{t("pages.ownershipDocumentHint")}</p>
                </div>
                <label className="flex cursor-pointer flex-col gap-2 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) p-4 text-sm text-(--color-text) transition-colors hover:border-(--color-gold)/50">
                  <span>{docFile ? docFile.name : t("common.optional")}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="text-xs text-(--color-text-muted)"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-border) sm:grid-cols-2">
              {[
                {
                  label: t("pages.howToListQuestion"),
                  value: submissionType === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest"),
                },
                { label: t("pages.titleLabel"), value: title },
                { label: t("pages.reviewPlateType"), value: plateTypeLabel(type, locale) },
                { label: t("pages.reviewLetters"), value: `${lettersAr} · ${lettersEn}` },
                { label: t("pages.reviewNumbers"), value: numbers, numeric: true },
                {
                  label: t("pages.reviewLogo"),
                  value: previewLogo ? (locale === "en" ? previewLogo.nameEn : previewLogo.nameAr) : t("pages.noLogoOption"),
                },
                {
                  label: t("pages.categoryLabel"),
                  value: selectedCategory ? (locale === "en" ? selectedCategory.nameEn : selectedCategory.nameAr) : t("pages.notSpecified"),
                },
                { label: t("pages.contactPhoneLabel"), value: contactPhone },
              ].map((row) => (
                <div key={row.label} className="bg-(--color-bg-elevated) p-4">
                  <dt className="text-xs text-(--color-text-faint)">{row.label}</dt>
                  <dd className={"mt-1 font-medium text-(--color-text) " + (row.numeric ? "tnum" : "")}>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {error && <p className="text-sm font-medium text-(--color-danger)">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-(--color-border) bg-black/20 p-5">
          <Button type="button" variant="ghost" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
            <Back className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Button>

          <Button type="submit" variant="gold" size="lg" loading={loading} disabled={!stepComplete && step < steps.length - 1}>
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
