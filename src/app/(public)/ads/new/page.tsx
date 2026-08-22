"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
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
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError(t("pages.pleaseSelectImage"));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subdir", "ads");
      const uploadData = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: formData });

      await apiFetch("/api/ads", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          price: price ? Number(price) : undefined,
          contactPhone,
          image: uploadData.url,
        }),
      });

      push(t("pages.adPublished"), "success");
      router.push("/ads");
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
      <h1 className="text-2xl font-bold text-(--color-text) mb-1">{t("pages.addAdTitle")}</h1>
      <p className="text-sm text-(--color-text-muted) mb-6">{t("pages.addAdSubtitle")}</p>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input label={t("pages.adTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-(--color-text)">{t("pages.adDescription")}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 py-2 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t("pages.adPriceOptional")} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              <Input
                label={t("pages.contactPhone")}
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
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
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            </div>
            {error && <p className="text-sm text-(--color-danger)">{error}</p>}
            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-2">
              {t("pages.publishAd")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
