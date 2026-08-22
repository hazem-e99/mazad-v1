"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, fieldProps, formError, validate, applyApiError, clearField } = useFormValidation(formRef);

  useEffect(() => {
    apiFetch<PlateDTO>(`/api/listings/${params.id}`)
      .then((data) => {
        setListing(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setPrice(data.price != null ? String(data.price) : "");
        setContactPhone(data.contactPhone ?? "");
      })
      .catch(() => setLoadError(t("common.error")));
  }, [params.id, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isMarketplace = listing?.submissionType === "marketplace";
    // listingUpdateSchema is the partial form of the submit schema, so the
    // same rules apply to an edit as to the original submission.
    const data = validate(schemas.listingUpdateSchema, {
      title,
      description: description || undefined,
      contactPhone,
      ...(isMarketplace ? { price: price.trim() === "" ? undefined : Number(price) } : {}),
    });
    if (!data) return;

    if (isMarketplace && (data.price == null || data.price <= 0)) {
      // A marketplace listing without a price would be republished as an
      // offer nobody can act on.
      applyApiError(null, t("validation.priceRequired"));
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/listings/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, price: isMarketplace ? data.price : null }),
        silentErrors: true,
      });
      push(t("pages.listingResubmitted"), "success");
      router.push("/my-listings");
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-(--color-text-muted)">{loadError ?? t("common.loading")}</div>;
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
          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
            {listing.submissionType === "marketplace" && (
              <Input
                label={t("pages.askingPriceLabel")}
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearField("price");
                }}
                required
                min={1}
                step={1}
                {...fieldProps("price")}
              />
            )}
            <Input
              label={t("pages.contactPhoneLabel")}
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

            {formError && (
              <p role="alert" className="text-sm font-medium text-(--color-danger)">
                {formError}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
              {t("pages.resubmitAction")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
