"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { apiFetch } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { AUCTION_CATEGORIES } from "@/lib/constants";
import type { AuctionCategory, PlateType, UsageType, PlateShape, PlateClassification } from "@/lib/constants";
import type { PlateLogoDTO } from "@/types/dto";

interface PlateOption {
  _id: string;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
  usageType: UsageType | null;
  shape: PlateShape | null;
  classification: PlateClassification | null;
  price: number | null;
  existingBidAmount: number | null;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminNewAuctionPage() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const { t, locale } = useTranslations();
  const [plates, setPlates] = useState<PlateOption[]>([]);
  // Prefills from the admin moderation screen's "Create Auction" action
  // (?plateId=...) — reused directly, never duplicated. A lazy initializer
  // reads it once at mount rather than setState-in-effect; guarded for SSR
  // since this "use client" page still renders server-side first.
  const [plateId, setPlateId] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("plateId") ?? ""
  );
  const [category, setCategory] = useState<AuctionCategory>("regular");
  const [startingPrice, setStartingPrice] = useState("1000");
  const [minIncrement, setMinIncrement] = useState("50");
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 5 * 60_000)));
  const [endAt, setEndAt] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 60 * 60_000)));
  const [directPurchaseEnabled, setDirectPurchaseEnabled] = useState(false);
  const [directPurchasePrice, setDirectPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { schemas, fieldProps, formError, validate, applyApiError, clearField } = useFormValidation(formRef);

  useEffect(() => {
    apiFetch<{ items: PlateOption[] }>("/api/plates?limit=100")
      .then((res) => {
        setPlates(res.items);
        // Carries the seller's submitted numbers forward into the auction
        // form instead of the admin re-typing them — "هل اللوحة مسيومة
        // سابقاً؟" becomes the seed starting price, and the listing's
        // proposed final price becomes the Buy Now price (reusing
        // directPurchase, not a second purchase mechanism). Applied once,
        // right after the plate list this page needs to resolve `plateId`
        // arrives — not a separate effect reacting to derived state.
        const prefillPlate = res.items.find((p) => p._id === plateId);
        if (prefillPlate?.existingBidAmount != null) setStartingPrice(String(prefillPlate.existingBidAmount));
        if (prefillPlate?.price != null) {
          setDirectPurchaseEnabled(true);
          setDirectPurchasePrice(String(prefillPlate.price));
        }
      })
      .catch(() => undefined);
    // Only ever runs once at mount — `plateId` is read from the URL via a
    // lazy initializer and never changes after that, so it's intentionally
    // omitted from the dependency array rather than re-running this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlate = plates.find((p) => p._id === plateId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // The same schema the POST handler parses: date ordering, minimum
    // duration, "end must be in the future", and the direct-purchase
    // price rules are all checked here before anything is sent.
    const data = validate(schemas.auctionSchema, {
      plate: plateId,
      category,
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
      const created = await apiFetch<{ _id: string }>("/api/auctions", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startAt: data.startAt.toISOString(),
          endAt: data.endAt.toISOString(),
        }),
        silentErrors: true,
      });
      push(t("admin.auctionCreated"), "success");
      router.push(`/admin/auctions/${created._id}`);
      router.refresh();
    } catch (err) {
      applyApiError(err, t("admin.auctionCreateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <h1 className="mb-6 text-2xl font-bold text-(--color-text)">{t("admin.newAuctionTitle")}</h1>
      <Card className="border-(--color-border) bg-(--color-surface) shadow-(--shadow-card)">
        <CardBody className="flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
          {selectedPlate && (
            <div className="flex items-center justify-center rounded-(--radius-md) bg-(--color-bg-elevated) p-8">
              <SaudiPlate
                type={selectedPlate.type}
                usageType={selectedPlate.usageType}
                shape={selectedPlate.shape}
                classification={selectedPlate.classification}
                lettersAr={selectedPlate.lettersAr}
                lettersEn={selectedPlate.lettersEn}
                numbers={selectedPlate.numbers}
                logo={selectedPlate.logo}
                size="md"
                locale={locale}
              />
            </div>
          )}

          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
            <div className="flex flex-col gap-4">
              <Select
                label={t("admin.fieldPlate")}
                required
                value={plateId}
                onChange={(e) => {
                  setPlateId(e.target.value);
                  clearField("plate");
                }}
                {...fieldProps("plate")}
                error={fieldProps("plate").error ?? undefined}
              >
                <option value="">{t("admin.choosePlate")}</option>
                {plates.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.lettersAr} {p.numbers} ({p.lettersEn})
                  </option>
                ))}
              </Select>

              <Select
                label={t("admin.fieldCategory")}
                value={category}
                onChange={(e) => setCategory(e.target.value as AuctionCategory)}
                {...fieldProps("category")}
              >
                {AUCTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "exclusive" ? t("auction.exclusiveBadge") : t("admin.categoryRegular")}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("admin.sectionPricing")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("admin.sectionTiming")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  // The end field owns the cross-field rules (after start,
                  // long enough, in the future), so its error renders here.
                  min={startAt}
                  onChange={(e) => {
                    setEndAt(e.target.value);
                    clearField("endAt");
                  }}
                  required
                  {...fieldProps("endAt")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("admin.sectionPurchase")}</h2>
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

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
              {t("admin.createAuctionSubmit")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
