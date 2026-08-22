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
import type { PlateLogoDTO } from "@/types/dto";

interface PlateLogoFormProps {
  mode: "create" | "edit";
  initial?: PlateLogoDTO;
}

export function PlateLogoForm({ mode, initial }: PlateLogoFormProps) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayImage = previewUrl ?? initial?.image ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "create" && !file) {
      setError(t("admin.logoImageRequired"));
      return;
    }

    setLoading(true);
    try {
      let imageUrl = initial?.image;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subdir", "plate-logos");
        const uploadData = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: formData });
        imageUrl = uploadData.url;
      }

      const payload = {
        nameAr,
        nameEn,
        image: imageUrl,
        isActive,
        sortOrder: Number(sortOrder) || 0,
      };

      if (mode === "create") {
        await apiFetch("/api/plate-logos", { method: "POST", body: JSON.stringify(payload) });
        push(t("admin.logoCreated"), "success");
      } else {
        await apiFetch(`/api/plate-logos/${initial!._id}`, { method: "PATCH", body: JSON.stringify(payload) });
        push(t("admin.logoUpdated"), "success");
      }
      router.push("/admin/plate-logos");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : mode === "create" ? t("admin.logoCreateFailed") : t("admin.logoUpdateFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-[820px] border-(--color-border) bg-(--color-surface) shadow-(--shadow-card)">
      <CardBody className="flex flex-col gap-5 p-5 sm:p-6 lg:p-7">
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-(--color-text)">
              {t("admin.logoImageLabel")}
              <span className="text-(--color-gold) ms-0.5" aria-hidden="true">*</span>
            </span>
            <label
              htmlFor="plate-logo-image-input"
              className="relative flex flex-col items-center justify-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-bg-elevated) overflow-hidden cursor-pointer hover:border-(--color-gold)/50 transition-colors h-40 w-40"
            >
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt="" className="absolute inset-0 h-full w-full object-contain bg-white p-4" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-(--color-text-faint)" aria-hidden="true" strokeWidth={1.5} />
                  <span className="text-xs text-(--color-text-faint)">{mode === "edit" ? t("admin.replaceImageAction") : t("admin.uploadImageAction")}</span>
                </>
              )}
              <input
                id="plate-logo-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          <Input label={t("admin.colNameAr")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
          <Input label={t("admin.colNameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" />
          <Input
            label={t("admin.logoSortOrderLabel")}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />

          <label className="flex items-center gap-2.5 text-sm text-(--color-text)">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-(--color-gold)" />
            {t("admin.logoActiveLabel")}
          </label>

          {error && <p className="text-sm text-(--color-danger)">{error}</p>}

          <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
            {t("admin.saveLogoButton")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
