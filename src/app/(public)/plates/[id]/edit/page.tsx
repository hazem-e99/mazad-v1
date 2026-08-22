"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { PlateDTO } from "@/types/dto";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();

  const [listing, setListing] = useState<PlateDTO | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PlateDTO>(`/api/listings/${params.id}`)
      .then((data) => {
        setListing(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setPrice(data.price != null ? String(data.price) : "");
        setContactPhone(data.contactPhone ?? "");
      })
      .catch(() => setError(t("common.error")));
  }, [params.id, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/api/listings/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: description || undefined,
          price: listing?.submissionType === "marketplace" ? Number(price) : null,
          contactPhone,
        }),
      });
      push(t("pages.listingResubmitted"), "success");
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-(--color-text-muted)">{error ?? t("common.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-(--color-text) mb-1">{t("pages.editListingTitle")}</h1>
      <p className="text-sm text-(--color-text-muted) mb-6">{t("pages.editListingSubtitle")}</p>

      {listing.moderationStatus === "rejected" && listing.rejectionReason && (
        <Card className="mb-4 border-(--color-danger)">
          <CardBody>
            <p className="text-sm text-(--color-danger)">
              {t("pages.rejectionReasonLabel")}: {listing.rejectionReason}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
            {listing.submissionType === "marketplace" && (
              <Input label={t("pages.askingPriceLabel")} type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={1} />
            )}
            <Input label={t("pages.contactPhoneLabel")} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />

            {error && <p className="text-sm text-(--color-danger)">{error}</p>}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
              {t("pages.resubmitAction")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
