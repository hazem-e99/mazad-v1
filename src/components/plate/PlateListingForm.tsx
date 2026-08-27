"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, Gavel, IdCard, ShieldAlert, Store, Upload } from "lucide-react";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { PreSubmitTipsGate } from "@/components/plate/PreSubmitTipsGate";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation, FORM_ERROR_KEY } from "@/hooks/useFormValidation";
import { validateUploadFile, IMAGE_MIME_TYPES, MAX_UPLOAD_MB } from "@/lib/fileValidation";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { usePlateCategories } from "@/hooks/usePlateCategories";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { deriveLettersEn, isValidPlateLettersAr } from "@/lib/plateLetters";
import { cn } from "@/lib/cn";
import { USAGE_TYPES, usageTypeLabel, plateShapeLabel, SUBMISSION_TYPES, COMMISSION_PERCENTAGE } from "@/lib/constants";
import type { UsageType, PlateShape, SubmissionType } from "@/lib/constants";
import { USAGE_TYPE_SHAPES, deriveLegacyPlateType, getAllowedLogos } from "@/lib/plateFormConfig";

// lettersEn is what deriveLettersEn("أ ب ج") produces (A B J, reversed) —
// kept in sync so the ghost preview never shows a mismatched pair.
const PREVIEW_PLACEHOLDER = { lettersAr: "أ ب ج", lettersEn: "JBA", numbers: "1234" };
const PREVIEW_PLACEHOLDER_SPORT = { lettersEn: "ABC", numbers: "1234" };

interface PlateListingFormProps {
  /**
   * "public" is the marketplace "أضف لوحتك" submission: it goes to the
   * moderation queue and asks for an ownership document. "admin" is the
   * same flow reused for staff-authored listings - the server auto-approves
   * those (see /api/listings' isStaff check), so there is no ownership
   * document step and no "submitted, pending review" messaging.
   */
  variant?: "public" | "admin";
}

/** A small radio-card group — the same visual pattern used for every
 * binary/ternary choice in this form (pricing type, each readiness
 * question) instead of a plain <select> or tiny native radios, per the
 * "selected option should be visually obvious" requirement. */
function RadioCardGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  fieldName,
  columns = 2,
}: {
  label: string;
  options: { value: T; label: string; hint?: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
  fieldName: string;
  columns?: 2 | 3;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-(--color-text)">{label}</span>
      <div
        className={cn("grid grid-cols-1 gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
        role="radiogroup"
        aria-label={label}
        aria-invalid={error ? true : undefined}
      >
        {options.map((option, i) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              data-field={i === 0 ? fieldName : undefined}
              onClick={() => onChange(option.value)}
              aria-checked={selected}
              className={cn(
                "flex min-h-20 flex-col gap-2 rounded-(--radius-lg) border p-4 text-start transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)",
                selected
                  ? "border-(--color-gold) bg-(--color-gold-tint) text-(--color-text)"
                  : error
                    ? "border-(--color-danger) bg-(--color-bg-elevated) text-(--color-text-muted)"
                    : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-text-muted) hover:border-(--color-gold)/50"
              )}
            >
              <span className="flex items-center justify-between gap-3">
                {Icon && <Icon className="h-5 w-5 text-(--color-gold)" />}
                {selected && <Check className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />}
              </span>
              <span className="font-semibold text-(--color-text)">{option.label}</span>
              {option.hint && <span className="text-xs leading-relaxed text-(--color-text-faint)">{option.hint}</span>}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-(--color-danger)">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The full "add a plate listing" wizard, shared between the public
 * marketplace submission page and the admin equivalent. The two only ever
 * differ in copy, the ownership-document step, and where they land after
 * success - every field, every validation rule, and the API call are the
 * same, so the two flows can never quietly drift apart.
 */
export function PlateListingForm({ variant = "public" }: PlateListingFormProps) {
  const isAdmin = variant === "admin";
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError: logosLoadError } = usePlateLogos();
  const { categories, loadError: categoriesLoadError } = usePlateCategories();

  // Staff never sees this gate — only a regular user submitting their own
  // plate does, and only once per visit to this form.
  const [tipsAcknowledged, setTipsAcknowledged] = useState(isAdmin);

  const [step, setStep] = useState(0);
  const [submissionType, setSubmissionType] = useState<SubmissionType | null>(null);

  const [lettersAr, setLettersAr] = useState("");
  const [lettersEnManual, setLettersEnManual] = useState("");
  const [numbers, setNumbers] = useState("");
  const [logoId, setLogoId] = useState<string | null>(null);
  const [usageType, setUsageType] = useState<UsageType | "">("");
  const [shape, setShape] = useState<PlateShape | "">("");
  const [categoryId, setCategoryId] = useState("");

  // Sport is a usage-type concept (§ Sports Plate rule) — not derived from
  // the legacy `type` bridge below, which can land on "small_sport" instead
  // of "sport" once a shape is picked and would otherwise miss this.
  const isSport = usageType === "sport";
  const lettersEn = useMemo(
    () => (isSport ? lettersEnManual.toUpperCase() : deriveLettersEn(lettersAr) ?? ""),
    [isSport, lettersEnManual, lettersAr]
  );

  // The wizard no longer shows the legacy `type` enum as a field of its
  // own — it's derived from the usage type + shape the user actually
  // picked, purely to satisfy the still-required DB/API field. See
  // deriveLegacyPlateType() in plateFormConfig.ts.
  const type = useMemo(() => deriveLegacyPlateType(usageType || null, shape || null), [usageType, shape]);
  const availableShapes = useMemo(() => (usageType ? USAGE_TYPE_SHAPES[usageType] : []), [usageType]);
  const availableLogos = useMemo(
    () => getAllowedLogos(logos, usageType || null, shape || null),
    [logos, usageType, shape]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [existingBidAmount, setExistingBidAmount] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [snapchat, setSnapchat] = useState("");

  // Sale-readiness answers (§ Plate Sale Readiness) — "" means unanswered.
  const [registrationValid, setRegistrationValid] = useState<"valid" | "expired" | "">("");
  const [inspectionValid, setInspectionValid] = useState<"yes" | "no" | "">("");
  const [insuranceAvailable, setInsuranceAvailable] = useState<"yes" | "no" | "">("");
  const [commissionAccepted, setCommissionAccepted] = useState(false);

  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, errors, errorFor, fieldProps, formError, report, applyApiError, setFieldError, clearField, clearAll } =
    useFormValidation(formRef);

  // Flags a letter the moment it's typed, rather than waiting for the step
  // transition — otherwise a rejected letter just leaves the auto-filled
  // English field silently blank with no clue why.
  function onLettersArChange(value: string) {
    setLettersAr(value);
    if (value.trim() === "" || isValidPlateLettersAr(value)) {
      clearField("lettersAr");
    } else {
      setFieldError("lettersAr", t("validation.lettersArInvalid"));
    }
  }

  function onLettersEnManualChange(value: string) {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
    setLettersEnManual(upper);
    clearField("lettersEn");
  }

  // Each choice narrows the next: a shape that no longer fits the newly
  // chosen usage type, or a logo no longer offered for the resulting
  // usage type + shape, is cleared right in the handler that changed its
  // dependency — not via an effect reacting to already-committed state.
  function onUsageTypeChange(next: UsageType | "") {
    setUsageType(next);
    clearField("usageType");
    const nextShapes = next ? USAGE_TYPE_SHAPES[next] : [];
    if (shape && !nextShapes.includes(shape)) {
      setShape("");
      setLogoId(null);
    }
  }

  function onShapeChange(next: PlateShape | "") {
    setShape(next);
    clearField("shape");
    const nextLogos = getAllowedLogos(logos, usageType || null, next || null);
    if (logoId && nextLogos && !nextLogos.some((l) => l._id === logoId)) setLogoId(null);
  }

  const previewLogo = useMemo(
    () => (logoId ? (logos ?? []).find((l) => l._id === logoId) ?? null : null),
    [logoId, logos]
  );
  const selectedCategory = useMemo(
    () => (categoryId ? (categories ?? []).find((c) => c._id === categoryId) ?? null : null),
    [categoryId, categories]
  );

  // Reads the same MIME allow-list and size ceiling validateUploadFile()
  // enforces (src/lib/fileValidation.ts, mirroring the server's own
  // limits) — never a second, hand-typed copy of those numbers.
  const allowedImageTypesLabel = useMemo(
    () => IMAGE_MIME_TYPES.map((mime) => mime.split("/")[1]?.toUpperCase()).join(locale === "ar" ? "، " : ", "),
    [locale]
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
    { key: "listing", label: t("pages.listingDetailsHeader"), hint: t("pages.stepPlateInfoHint") },
    { key: "plate", label: t("pages.stepPlateInfo"), hint: t("pages.stepPlateInfoHint") },
    { key: "media", label: t("pages.plateImageHeader"), hint: t("pages.uploadPlatePhotoHint") },
    { key: "readiness", label: t("pages.stepReadiness"), hint: t("pages.stepReadinessHint") },
    { key: "pricingType", label: t("pages.stepPricingType"), hint: t("pages.stepPricingTypeHint") },
    { key: "pricingDetails", label: t("pages.stepPricingDetails"), hint: t("pages.stepPricingDetailsHint") },
    { key: "review", label: t("pages.stepReview"), hint: t("pages.stepReviewHint") },
  ];

  // The payload the API will receive, assembled once so the step schemas
  // and the final submit validate exactly the bytes that get sent — there
  // is no second, looser code path that could smuggle a bad value through.
  function buildPayload() {
    return {
      type,
      lettersAr: isSport ? "" : lettersAr,
      lettersEn: isSport ? lettersEnManual.toUpperCase() : undefined,
      numbers,
      logo: logoId,
      usageType: usageType || undefined,
      shape: shape || undefined,
      category: categoryId || null,
      title,
      description: description || undefined,
      price: price.trim() === "" ? undefined : Number(price),
      existingBidAmount:
        submissionType === "auction_request" && existingBidAmount.trim() !== "" ? Number(existingBidAmount) : undefined,
      registrationValid: registrationValid === "" ? undefined : registrationValid === "valid",
      inspectionValid: inspectionValid === "" ? undefined : inspectionValid === "yes",
      insuranceAvailable: insuranceAvailable === "" ? undefined : insuranceAvailable === "yes",
      // A placeholder for the not-yet-uploaded file: the real URL is
      // substituted after the upload succeeds. Only its presence is being
      // validated at this point — the plate photo itself is optional, so
      // no file means no value at all rather than an empty string.
      image: imageFile ? "pending-upload" : undefined,
      contactPhone,
      contactEmail: contactEmail || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      snapchat: snapchat || undefined,
      submissionType: submissionType ?? undefined,
      commissionAccepted: isAdmin ? undefined : commissionAccepted,
    };
  }

  /** Which fields each step owns. A step is judged only on its own
   * fields, so step 1 is never blocked by a photo that belongs to step 3. */
  const STEP_FIELDS: string[][] = [
    ["title", "description", "contactPhone", "contactEmail", "instagram", "tiktok", "snapchat"],
    ["lettersAr", "lettersEn", "numbers", "type", "logo", "usageType", "shape", "category"],
    ["image", "ownershipDocument"],
    ["registrationValid", "inspectionValid", "insuranceAvailable"],
    ["submissionType"],
    ["price", "existingBidAmount"],
    ["commissionAccepted"],
  ];

  /**
   * Validates one step by running the full listing schema and keeping only
   * the failures that belong to that step. Reusing the real schema (rather
   * than a hand-written per-step copy) is what guarantees the client and
   * the server agree about what "valid" means.
   */
  function validateStep(index: number, options: { silent?: boolean } = {}): boolean {
    const owned = STEP_FIELDS[index];
    if (owned.length === 0) return true;

    const result = schemas.listingSubmitSchema.safeParse(buildPayload());
    const stepErrors: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
        if (!owned.includes(key)) continue;
        if (!(key in stepErrors)) stepErrors[key] = issue.message;
      }
    }

    // Sport plates are English-only; every other type needs a real
    // lettersAr — checked manually rather than in the shared schema (a
    // cross-field refine on a schema this size made the TS compiler choke
    // on inference). See checkSportLetters in src/lib/validation.ts.
    if (index === 1) {
      if (isSport && lettersEnManual.trim() === "") stepErrors.lettersEn = t("validation.lettersArRequired");
      if (!isSport && lettersAr.trim() === "") stepErrors.lettersAr = t("validation.lettersArRequired");
    }

    if (index === 3) {
      if (!registrationValid) stepErrors.registrationValid = t("validation.selectRequired");
      if (!inspectionValid) stepErrors.inspectionValid = t("validation.selectRequired");
      if (!insuranceAvailable) stepErrors.insuranceAvailable = t("validation.selectRequired");
    }
    if (index === 4 && !submissionType) stepErrors.submissionType = t("pages.chooseSubmissionTypeFirst");
    if (index === 6 && !isAdmin && !commissionAccepted) {
      stepErrors.commissionAccepted = t("validation.selectRequired");
    }

    if (Object.keys(stepErrors).length === 0) return true;
    report(stepErrors, { toastKey: "fixBeforeContinue", silent: options.silent });
    return false;
  }

  /** Steps are only reachable once every step before them validates, so a
   * user cannot jump ahead past a half-filled step via the Stepper. */
  function goToStep(target: number) {
    if (target <= step) {
      clearAll();
      setStep(target);
      return;
    }
    for (let i = step; i < target; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    clearAll();
    setStep(target);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Advance one step at a time; a failing step stays put and shows why.
    if (step < steps.length - 1) {
      if (validateStep(step)) {
        clearAll();
        setStep((s) => s + 1);
      }
      return;
    }

    // Final guard: re-check every step, and land the user on the first one
    // that still has a problem rather than failing silently at the API.
    for (let i = 0; i < steps.length - 1; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    // Both the plate photo and the ownership document are optional — some
    // plates simply have no photo on hand — but whichever ones are
    // attached still get validated for type/size before upload.
    if (imageFile) {
      const fileError = validateUploadFile(imageFile, t, "image");
      if (fileError) {
        report({ image: fileError });
        setStep(2);
        return;
      }
    }
    if (docFile) {
      const docError = validateUploadFile(docFile, t, "image");
      if (docError) {
        report({ ownershipDocument: docError });
        setStep(2);
        return;
      }
    }

    setLoading(true);
    try {
      let image: string | undefined;
      if (imageFile) {
        const imageForm = new FormData();
        imageForm.append("file", imageFile);
        imageForm.append("subdir", "plates");
        const imageData = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: imageForm });
        image = imageData.url;
      }

      let ownershipDocument: string | undefined;
      if (docFile) {
        const docForm = new FormData();
        docForm.append("file", docFile);
        const docData = await apiFetch<{ ref: string }>("/api/uploads/ownership-document", { method: "POST", body: docForm });
        ownershipDocument = docData.ref;
      }

      await apiFetch("/api/listings", {
        method: "POST",
        body: JSON.stringify({ ...buildPayload(), image, ownershipDocument }),
        silentErrors: true,
      });

      push(t(isAdmin ? "admin.plateCreated" : "pages.plateSubmitted"), "success");
      router.push(isAdmin ? "/admin/plates" : "/my-listings");
      router.refresh();
    } catch (err) {
      applyApiError(err, isAdmin ? t("admin.plateCreateFailed") : undefined);
      // Server-side rejections are field-addressed too: send the user back
      // to the step that owns the first bad field.
      const rejected = Object.keys(
        err && typeof err === "object" && "fieldErrors" in err
          ? ((err as { fieldErrors: Record<string, string> }).fieldErrors ?? {})
          : {}
      );
      const targetStep = STEP_FIELDS.findIndex((fields) => rejected.some((f) => fields.includes(f)));
      if (targetStep >= 0) setStep(targetStep);
    } finally {
      setLoading(false);
    }
  }

  if (!tipsAcknowledged) {
    return <PreSubmitTipsGate onContinue={() => setTipsAcknowledged(true)} />;
  }

  return (
    <div className="mz-container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
          <IdCard className="h-7 w-7 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
          {t(isAdmin ? "admin.newPlateTitle" : "pages.addPlateTitle")}
        </h1>
        {!isAdmin && <p className="mt-2 text-sm text-(--color-text-muted)">{t("pages.addPlateSubtitle")}</p>}
      </div>

      <div className="mz-edge-gold relative mb-6 flex flex-col items-center gap-3 overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated) px-6 py-10">
        <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-0 opacity-70" />
        <span className="relative text-[11px] font-semibold uppercase tracking-wider text-(--color-text-faint)">
          {t("pages.previewLabel")}
        </span>
        <SaudiPlate
          type={type}
          usageType={usageType || null}
          shape={shape || null}
          lettersAr={isSport ? "" : lettersAr.trim() ? lettersAr : PREVIEW_PLACEHOLDER.lettersAr}
          lettersEn={
            isSport
              ? lettersEnManual.trim()
                ? lettersEn
                : PREVIEW_PLACEHOLDER_SPORT.lettersEn
              : lettersAr.trim()
                ? lettersEn
                : PREVIEW_PLACEHOLDER.lettersEn
          }
          numbers={numbers || PREVIEW_PLACEHOLDER.numbers}
          logo={previewLogo}
          size="lg"
          locale={locale}
          className="relative"
        />
        <span className="relative text-xs text-(--color-text-faint)">{t("pages.livePreviewHint")}</span>
      </div>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface)">
        <div className="border-b border-(--color-border) p-5 sm:p-6">
          <Stepper steps={steps} current={step} onStepChange={goToStep} />
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-(--color-text)">{steps[step].label}</h2>
            <p className="mt-1 text-sm text-(--color-text-muted)">{steps[step].hint}</p>
          </div>

          {step === 0 && (
            <div className="flex flex-col gap-5">
              <Input
                label={t("pages.titleLabel")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearField("title");
                }}
                required
                maxLength={150}
                {...fieldProps("title")}
              />
              <Textarea
                label={t("pages.descriptionLabel")}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearField("description");
                }}
                rows={4}
                maxLength={2000}
                {...fieldProps("description")}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("pages.contactPhoneLabel")}
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    clearField("contactPhone");
                  }}
                  placeholder="05xxxxxxxx"
                  required
                  {...fieldProps("contactPhone")}
                />
                <Input
                  label={t("pages.contactEmailLabel")}
                  type="email"
                  dir="ltr"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    clearField("contactEmail");
                  }}
                  {...fieldProps("contactEmail")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label={t("pages.instagramLabel")}
                  value={instagram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    clearField("instagram");
                  }}
                  maxLength={60}
                  {...fieldProps("instagram")}
                />
                <Input
                  label={t("pages.tiktokLabel")}
                  value={tiktok}
                  onChange={(e) => {
                    setTiktok(e.target.value);
                    clearField("tiktok");
                  }}
                  maxLength={60}
                  {...fieldProps("tiktok")}
                />
                <Input
                  label={t("pages.snapchatLabel")}
                  value={snapchat}
                  onChange={(e) => {
                    setSnapchat(e.target.value);
                    clearField("snapchat");
                  }}
                  maxLength={60}
                  {...fieldProps("snapchat")}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              {isSport ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input
                    label={t("pages.lettersEnSportLabel")}
                    value={lettersEnManual}
                    onChange={(e) => onLettersEnManualChange(e.target.value)}
                    required
                    dir="ltr"
                    maxLength={4}
                    placeholder={PREVIEW_PLACEHOLDER_SPORT.lettersEn}
                    hint={t("pages.lettersEnSportHint")}
                    {...fieldProps("lettersEn")}
                  />
                  <Input
                    label={t("pages.numbersLabel")}
                    value={numbers}
                    onChange={(e) => {
                      setNumbers(e.target.value.replace(/[^0-9]/g, ""));
                      clearField("numbers");
                    }}
                    inputMode="numeric"
                    maxLength={4}
                    required
                    dir="ltr"
                    placeholder={PREVIEW_PLACEHOLDER_SPORT.numbers}
                    {...fieldProps("numbers")}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Input
                    label={t("pages.lettersArLabel")}
                    value={lettersAr}
                    onChange={(e) => onLettersArChange(e.target.value)}
                    required
                    dir="rtl"
                    maxLength={10}
                    placeholder={PREVIEW_PLACEHOLDER.lettersAr}
                    {...fieldProps("lettersAr")}
                  />
                  <Input
                    label={t("pages.lettersEnLabel")}
                    value={lettersEn}
                    readOnly
                    disabled
                    dir="ltr"
                    placeholder={PREVIEW_PLACEHOLDER.lettersEn}
                    hint={t("pages.lettersEnAutoHint")}
                  />
                  <Input
                    label={t("pages.numbersLabel")}
                    value={numbers}
                    onChange={(e) => {
                      setNumbers(e.target.value.replace(/[^0-9]/g, ""));
                      clearField("numbers");
                    }}
                    inputMode="numeric"
                    maxLength={4}
                    required
                    dir="ltr"
                    placeholder={PREVIEW_PLACEHOLDER.numbers}
                    {...fieldProps("numbers")}
                  />
                </div>
              )}

              {/* The dependency chain: usage type decides which shapes are
                  offered, and usage type + shape together decide which
                  logos are offered — see plateFormConfig.ts. Each Select
                  stays disabled with a "pick the previous one first"
                  placeholder until its dependency is satisfied. */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Select
                  label={t("pages.usageTypeLabel")}
                  value={usageType}
                  onChange={(e) => onUsageTypeChange(e.target.value as UsageType | "")}
                  required
                  {...fieldProps("usageType")}
                >
                  <option value="" disabled hidden>
                    {t("pages.chooseUsageType")}
                  </option>
                  {USAGE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {usageTypeLabel(item, locale)}
                    </option>
                  ))}
                </Select>
                <Select
                  label={t("pages.shapeLabel")}
                  value={shape}
                  onChange={(e) => onShapeChange(e.target.value as PlateShape | "")}
                  disabled={!usageType}
                  required
                  {...fieldProps("shape")}
                >
                  <option value="" disabled hidden>
                    {usageType ? t("pages.chooseShape") : t("pages.chooseUsageTypeFirst")}
                  </option>
                  {availableShapes.map((item) => (
                    <option key={item} value={item}>
                      {plateShapeLabel(item, locale)}
                    </option>
                  ))}
                </Select>
                <PlateLogoSelect
                  label={t("pages.plateLogoLabel")}
                  value={logoId}
                  onChange={setLogoId}
                  logos={availableLogos}
                  loadError={logosLoadError}
                  disabled={!shape}
                  placeholder={!shape ? t("pages.chooseShapeFirst") : undefined}
                />
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
            <div className="flex flex-col gap-5">
              {!isAdmin && (
                <p className="text-xs leading-relaxed text-(--color-text-muted)">
                  {t("pages.plateImageTip")}{" "}
                  <span className="text-(--color-text-faint)">
                    {t("pages.uploadFileConstraints", { types: allowedImageTypesLabel, max: MAX_UPLOAD_MB })}
                  </span>
                </p>
              )}
              <div className={cn("grid grid-cols-1 gap-5", !isAdmin && "lg:grid-cols-[1fr_0.85fr]")}>
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
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] ?? null;
                      const problem = validateUploadFile(picked, t, "image");
                      if (problem) {
                        // Reject at the picker so the user sees why straight
                        // away instead of after a failed upload round-trip.
                        e.target.value = "";
                        setImageFile(null);
                        setFieldError("image", problem);
                        push(problem, "error");
                        return;
                      }
                      setImageFile(picked);
                      clearField("image");
                    }}
                    className="sr-only"
                  />
                </label>
                {errorFor("image") && (
                  <p role="alert" className="text-xs font-medium text-(--color-danger) lg:col-span-2">
                    {errorFor("image")}
                  </p>
                )}

                {!isAdmin && (
                  <div className="flex flex-col justify-between gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-5">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-(--color-text)">
                        <FileText className="h-4 w-4 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                        {t("pages.ownershipDocumentLabel")}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-(--color-text-muted)">{t("pages.ownershipDocumentHint")}</p>
                    </div>

                    <Callout tone="info" icon={ShieldAlert} title={t("pages.ownershipDocumentAlertTitle")}>
                      <p>{t("pages.ownershipDocumentAlertBody")}</p>
                      <ul className="mt-2 flex flex-col gap-1 text-xs text-(--color-text-faint)">
                        <li>{t("pages.ownershipDocumentAlertPlateImageNote")}</li>
                        <li>{t("pages.ownershipDocumentAlertDocNote")}</li>
                      </ul>
                    </Callout>

                    <label
                      htmlFor="ownership-document-input"
                      className="relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface) p-4 text-center transition-colors hover:border-(--color-gold)/50"
                    >
                      {docFile ? (
                        <span className="text-sm font-medium text-(--color-text)">{docFile.name}</span>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                          <span className="text-sm font-medium text-(--color-text)">{t("pages.ownershipDocumentUploadCta")}</span>
                          <span className="text-xs text-(--color-text-faint)">{t("pages.ownershipDocumentPrivacyHint")}</span>
                        </>
                      )}
                      <input
                        id="ownership-document-input"
                        name="ownershipDocument"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const picked = e.target.files?.[0] ?? null;
                          const problem = validateUploadFile(picked, t, "image");
                          if (problem) {
                            e.target.value = "";
                            setDocFile(null);
                            setFieldError("ownershipDocument", problem);
                            push(problem, "error");
                            return;
                          }
                          setDocFile(picked);
                          clearField("ownershipDocument");
                        }}
                        className="sr-only"
                      />
                    </label>
                    {errorFor("ownershipDocument") && (
                      <p role="alert" className="text-xs font-medium text-(--color-danger)">
                        {errorFor("ownershipDocument")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <RadioCardGroup
                label={t("pages.registrationValidQuestion")}
                fieldName="registrationValid"
                value={registrationValid}
                onChange={(v) => {
                  setRegistrationValid(v);
                  clearField("registrationValid");
                }}
                error={errorFor("registrationValid")}
                options={[
                  { value: "valid", label: t("pages.registrationValidOption") },
                  { value: "expired", label: t("pages.registrationExpiredOption") },
                ]}
              />
              <RadioCardGroup
                label={t("pages.inspectionValidQuestion")}
                fieldName="inspectionValid"
                value={inspectionValid}
                onChange={(v) => {
                  setInspectionValid(v);
                  clearField("inspectionValid");
                }}
                error={errorFor("inspectionValid")}
                options={[
                  { value: "yes", label: t("common.yes") },
                  { value: "no", label: t("common.no") },
                ]}
              />
              <RadioCardGroup
                label={t("pages.insuranceAvailableQuestion")}
                fieldName="insuranceAvailable"
                value={insuranceAvailable}
                onChange={(v) => {
                  setInsuranceAvailable(v);
                  clearField("insuranceAvailable");
                }}
                error={errorFor("insuranceAvailable")}
                options={[
                  { value: "yes", label: t("common.yes") },
                  { value: "no", label: t("common.no") },
                ]}
              />
            </div>
          )}

          {step === 4 && (
            <RadioCardGroup
              label={t("pages.howToListQuestion")}
              fieldName="submissionType"
              value={submissionType ?? ""}
              onChange={(v) => {
                setSubmissionType(v);
                clearField("submissionType");
              }}
              error={errorFor("submissionType")}
              options={SUBMISSION_TYPES.map((option) => ({
                value: option,
                label: option === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest"),
                hint: option === "marketplace" ? t("pages.submissionTypeMarketplaceHint") : t("pages.submissionTypeAuctionRequestHint"),
                icon: option === "marketplace" ? Store : Gavel,
              }))}
            />
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {submissionType === "auction_request" && (
                <Input
                  label={t("pages.existingBidLabel")}
                  type="number"
                  inputMode="numeric"
                  value={existingBidAmount}
                  onChange={(e) => {
                    setExistingBidAmount(e.target.value);
                    clearField("existingBidAmount");
                  }}
                  min={1}
                  step={1}
                  hint={t("pages.existingBidHint")}
                  {...fieldProps("existingBidAmount")}
                />
              )}
              <Input
                label={t("pages.finalPriceLabel")}
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearField("price");
                }}
                min={1}
                step={1}
                required={submissionType === "marketplace"}
                hint={submissionType === "auction_request" ? t("pages.finalPriceAuctionHint") : undefined}
                {...fieldProps("price")}
              />
            </div>
          )}

          {step === 6 && (
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-border) sm:grid-cols-2">
              {[
                {
                  label: t("pages.howToListQuestion"),
                  value: submissionType === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest"),
                },
                { label: t("pages.titleLabel"), value: title },
                { label: t("pages.reviewPlateType"), value: usageType ? usageTypeLabel(usageType, locale) : "" },
                { label: t("pages.reviewShape"), value: shape ? plateShapeLabel(shape, locale) : "" },
                { label: t("pages.reviewLetters"), value: isSport ? lettersEn : `${lettersAr} · ${lettersEn}` },
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

          {step === 6 && !isAdmin && (
            <div className="mt-4">
              <Checkbox
                label={t("pages.commissionAcceptLabel", { percent: COMMISSION_PERCENTAGE })}
                checked={commissionAccepted}
                onChange={(e) => {
                  setCommissionAccepted(e.target.checked);
                  clearField("commissionAccepted");
                }}
              />
              {errorFor("commissionAccepted") && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-(--color-danger)">
                  {errorFor("commissionAccepted")}
                </p>
              )}
            </div>
          )}

          {formError && (
            <p role="alert" className="text-sm font-medium text-(--color-danger)">
              {formError}
            </p>
          )}
          {!formError && Object.keys(errors).length > 0 && (
            <p role="alert" className="text-sm font-medium text-(--color-danger)">
              {t("validation.errorsCount", { count: Object.keys(errors).length })}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-(--color-border) bg-black/20 p-5">
          <Button type="button" variant="ghost" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
            <Back className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Button>

          {/* Deliberately always enabled: a disabled button tells the user
              nothing. Pressing it runs validation and names what is
              missing, both inline and as a toast. */}
          <Button type="submit" variant="gold" size="lg" loading={loading}>
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
