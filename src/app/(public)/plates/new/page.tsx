"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Gavel, Store } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { PlateLogoSelect } from "@/components/plate/PlateLogoSelect";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { usePlateLogos } from "@/hooks/usePlateLogos";
import { usePlateCategories } from "@/hooks/usePlateCategories";
import { useTranslations } from "@/components/i18n/LocaleProvider";
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

const selectClass =
  "h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)";

export default function NewPlatePage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const { logos, loadError: logosLoadError } = usePlateLogos();
  const { categories, loadError: categoriesLoadError } = usePlateCategories();

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

  const previewLogo = logoId ? (logos ?? []).find((l) => l._id === logoId) ?? null : null;

  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!submissionType) {
      setError(t("pages.chooseSubmissionTypeFirst"));
      return;
    }
    if (!imageFile) {
      setError(t("pages.plateImageRequired"));
      return;
    }

    setLoading(true);
    try {
      const imageForm = new FormData();
      imageForm.append("file", imageFile);
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
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-(--color-text)">{t("pages.howToListQuestion")}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUBMISSION_TYPES.map((option) => {
                const selected = submissionType === option;
                const Icon = option === "marketplace" ? Store : Gavel;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSubmissionType(option)}
                    aria-pressed={selected}
                    className={`flex flex-col gap-2 rounded-(--radius-md) border p-4 text-start transition-colors ${
                      selected ? "border-(--color-gold) bg-(--color-gold)/10" : "border-(--color-border-strong) bg-(--color-bg-elevated) hover:border-(--color-gold)/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-(--color-gold)" aria-hidden="true" />
                      {selected && <Check className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />}
                    </div>
                    <span className="font-semibold text-(--color-text)">
                      {option === "marketplace" ? t("pages.submissionTypeMarketplace") : t("pages.submissionTypeAuctionRequest")}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">
                      {option === "marketplace" ? t("pages.submissionTypeMarketplaceHint") : t("pages.submissionTypeAuctionRequestHint")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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

          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.plateTypeLabel")}</span>
                <select value={type} onChange={(e) => setType(e.target.value as PlateType)} className={selectClass}>
                  {PLATE_TYPES.map((plateType) => (
                    <option key={plateType} value={plateType}>
                      {plateTypeLabel(plateType, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <PlateLogoSelect label={t("pages.plateLogoLabel")} value={logoId} onChange={setLogoId} logos={logos} loadError={logosLoadError} />
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
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-(--color-border)">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.classificationLabel")}</span>
                <select value={classification} onChange={(e) => setClassification(e.target.value as PlateClassification | "")} className={selectClass}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {plateClassificationLabel(c, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.usageTypeLabel")}</span>
                <select value={usageType} onChange={(e) => setUsageType(e.target.value as UsageType | "")} className={selectClass}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {USAGE_TYPES.map((u) => (
                    <option key={u} value={u}>
                      {usageTypeLabel(u, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.shapeLabel")}</span>
                <select value={shape} onChange={(e) => setShape(e.target.value as PlateShape | "")} className={selectClass}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {plateShapeLabel(s, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.sizeLabel")}</span>
                <select value={size} onChange={(e) => setSize(e.target.value as PlateSize | "")} className={selectClass}>
                  <option value="">{t("pages.notSpecified")}</option>
                  {PLATE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {plateSizeLabel(s, locale)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-(--color-text)">{t("pages.categoryLabel")}</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass} disabled={categoriesLoadError}>
                <option value="">{t("pages.notSpecified")}</option>
                {(categories ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {locale === "en" ? c.nameEn : c.nameAr}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-4 pt-4 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("pages.listingDetailsHeader")}</h2>
              <Input label={t("pages.titleLabel")} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.descriptionLabel")}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 py-2 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
                />
              </label>
              {submissionType === "marketplace" && (
                <Input
                  label={t("pages.askingPriceLabel")}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min={1}
                />
              )}
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("pages.plateImageHeader")}</h2>
              <label
                htmlFor="plate-image-input"
                className="relative flex flex-col items-center justify-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) overflow-hidden cursor-pointer hover:border-(--color-gold)/50 transition-colors h-40 w-full sm:w-64"
              >
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-(--color-text-faint) px-4 text-center">{t("pages.uploadPlatePhotoHint")}</span>
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

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("pages.ownershipDocumentLabel")}</span>
                <span className="text-xs text-(--color-text-muted)">{t("pages.ownershipDocumentHint")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-(--color-text)"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("pages.contactInfoHeader")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("pages.contactPhoneLabel")}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                />
                <Input label={t("pages.contactEmailLabel")} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label={t("pages.instagramLabel")} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                <Input label={t("pages.tiktokLabel")} value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
                <Input label={t("pages.snapchatLabel")} value={snapchat} onChange={(e) => setSnapchat(e.target.value)} />
              </div>
            </div>

            {error && <p className="text-sm text-(--color-danger)">{error}</p>}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("pages.submitPlate")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
