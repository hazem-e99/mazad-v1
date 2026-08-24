"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The owner's own restricted auction form — same field set and the same
 * shared `auctionSchema` the admin form validates against (§ User-Created
 * Auctions), just without the plate picker or category choice: the plate
 * is fixed by the page this is rendered from, and `category` is forced to
 * "regular" server-side regardless of anything sent here. The auction
 * this creates starts "قيد المراجعة" (draft) — POST /api/auctions decides
 * that, not this form.
 */
export function UserAuctionForm({ plateId }: { plateId: string }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t } = useTranslations();
  const [startingPrice, setStartingPrice] = useState("1000");
  const [minIncrement, setMinIncrement] = useState("50");
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 5 * 60_000)));
  const [endAt, setEndAt] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 60 * 60_000)));
  const [directPurchaseEnabled, setDirectPurchaseEnabled] = useState(false);
  const [directPurchasePrice, setDirectPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, fieldProps, formError, validate, applyApiError, clearField } = useFormValidation(formRef);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = validate(schemas.auctionSchema, {
      plate: plateId,
      category: "regular",
      startingPrice: startingPrice.trim() === "" ? undefined : Number(startingPrice),
      minIncrement: minIncrement.trim() === "" ? undefined : Number(minIncrement),
      startAt,
      endAt,
      directPurchaseEnabled,
      directPurchasePrice:
        directPurchaseEnabled && directPurchasePrice.trim() !== "" ? Number(directPurchasePrice) : null,
    });
    if (!data) return;

    setLoading(true);
    try {
      await apiFetch<{ _id: string }>("/api/auctions", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startAt: data.startAt.toISOString(),
          endAt: data.endAt.toISOString(),
        }),
        silentErrors: true,
      });
      push(t("pages.auctionSubmittedForReview"), "success");
      router.push("/my-listings");
      router.refresh();
    } catch (err) {
      applyApiError(err, t("admin.auctionCreateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-6 p-5 sm:p-6">
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("admin.fieldStartingPrice")}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={startingPrice}
              onChange={(e) => {
                setStartingPrice(e.target.value);
                clearField("startingPrice");
              }}
              required
              {...fieldProps("startingPrice")}
            />
            <Input
              label={t("admin.fieldMinIncrement")}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={minIncrement}
              onChange={(e) => {
                setMinIncrement(e.target.value);
                clearField("minIncrement");
              }}
              required
              {...fieldProps("minIncrement")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("admin.fieldStartTime")}
              type="datetime-local"
              value={startAt}
              onChange={(e) => {
                setStartAt(e.target.value);
                clearField("startAt");
                clearField("endAt");
              }}
              required
              {...fieldProps("startAt")}
            />
            <Input
              label={t("admin.fieldEndTime")}
              type="datetime-local"
              value={endAt}
              min={startAt}
              onChange={(e) => {
                setEndAt(e.target.value);
                clearField("endAt");
              }}
              required
              {...fieldProps("endAt")}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-(--color-border) pt-5">
            <Checkbox
              label={t("admin.enableDirectPurchase")}
              checked={directPurchaseEnabled}
              onChange={(e) => {
                setDirectPurchaseEnabled(e.target.checked);
                clearField("directPurchasePrice");
              }}
            />
            {directPurchaseEnabled && (
              <Input
                label={t("admin.fieldDirectPurchasePrice")}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={directPurchasePrice}
                onChange={(e) => {
                  setDirectPurchasePrice(e.target.value);
                  clearField("directPurchasePrice");
                }}
                required
                {...fieldProps("directPurchasePrice")}
              />
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm font-medium text-(--color-danger)">
              {formError}
            </p>
          )}

          <Button type="submit" variant="gold" size="lg" loading={loading}>
            {t("pages.submitAuctionForReview")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
