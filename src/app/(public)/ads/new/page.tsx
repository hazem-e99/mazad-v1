"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { validateUploadFile } from "@/lib/fileValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function NewAdPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, errorFor, fieldProps, formError, validate, applyApiError, setFieldError, clearField } =
    useFormValidation(formRef);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // The image is required but is not a value the schema can see until
    // it has been uploaded, so it is checked alongside — not instead of —
    // the schema, and both problems surface in the same pass.
    const fileProblem = file ? validateUploadFile(file, t, "image") : t("pages.pleaseSelectImage");

    const data = validate(schemas.createAdSchema, {
      title,
      description: description || undefined,
      price: price.trim() === "" ? undefined : Number(price),
      contactPhone,
      image: file ? "pending-upload" : "",
    });

    if (fileProblem) setFieldError("image", fileProblem);
    if (!data || fileProblem) {
      if (!data) return;
      push(fileProblem as string, "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("subdir", "ads");
      const uploadData = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
        silentErrors: true,
      });

      await apiFetch("/api/ads", {
        method: "POST",
        body: JSON.stringify({ ...data, image: uploadData.url }),
        silentErrors: true,
      });

      push(t("pages.adPublished"), "success");
      router.push("/ads");
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-(--color-text) mb-1">{t("pages.addAdTitle")}</h1>
      <p className="text-sm text-(--color-text-muted) mb-6">{t("pages.addAdSubtitle")}</p>

      <Card>
        <CardBody>
          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label={t("pages.adTitle")}
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
              label={t("pages.adDescription")}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearField("description");
              }}
              rows={3}
              maxLength={1000}
              {...fieldProps("description")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("pages.adPriceOptional")}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearField("price");
                }}
                {...fieldProps("price")}
              />
              <Input
                label={t("pages.contactPhone")}
                type="tel"
                inputMode="numeric"
                dir="ltr"
                placeholder="05xxxxxxxx"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  clearField("contactPhone");
                }}
                required
                {...fieldProps("contactPhone")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-(--color-text)">
                {t("pages.adImage")}
                <span className="text-(--color-gold) ms-0.5" aria-hidden="true">*</span>
              </span>
              <label
                htmlFor="ad-image-input"
                className="relative flex flex-col items-center justify-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) overflow-hidden cursor-pointer hover:border-(--color-gold)/50 transition-colors aspect-video"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.5} />
                    <span className="text-xs text-(--color-text-faint)">{t("pages.adImage")}</span>
                  </>
                )}
                <input
                  id="ad-image-input"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;
                    const problem = validateUploadFile(picked, t, "image");
                    if (problem) {
                      e.target.value = "";
                      setFile(null);
                      setFieldError("image", problem);
                      push(problem, "error");
                      return;
                    }
                    setFile(picked);
                    clearField("image");
                  }}
                  className="sr-only"
                />
              </label>
              {errorFor("image") && (
                <p role="alert" className="text-xs font-medium text-(--color-danger)">
                  {errorFor("image")}
                </p>
              )}
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-(--color-danger)">
                {formError}
              </p>
            )}
            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("pages.publishAd")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
