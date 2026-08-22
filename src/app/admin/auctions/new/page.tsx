"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlateRenderer } from "@/components/plate/PlateRenderer";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { AUCTION_CATEGORIES } from "@/lib/constants";
import type { AuctionCategory, PlateType } from "@/lib/constants";
import type { PlateLogoDTO } from "@/types/dto";

interface PlateOption {
  _id: string;
  type: PlateType;
  lettersAr: string;
  lettersEn: string;
  numbers: string;
  logo: PlateLogoDTO | null;
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
  const [plateId, setPlateId] = useState("");
  const [category, setCategory] = useState<AuctionCategory>("regular");
  const [startingPrice, setStartingPrice] = useState("1000");
  const [minIncrement, setMinIncrement] = useState("50");
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 5 * 60_000)));
  const [endAt, setEndAt] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 60 * 60_000)));
  const [directPurchaseEnabled, setDirectPurchaseEnabled] = useState(false);
  const [directPurchasePrice, setDirectPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ items: PlateOption[] }>("/api/plates?limit=100")
      .then((res) => setPlates(res.items))
      .catch(() => undefined);
  }, []);

  const selectedPlate = plates.find((p) => p._id === plateId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!plateId) {
      setError(t("admin.selectPlateRequired"));
      return;
    }

    setLoading(true);
    try {
      const created = await apiFetch<{ _id: string }>("/api/auctions", {
        method: "POST",
        body: JSON.stringify({
          plate: plateId,
          category,
          startingPrice: Number(startingPrice),
          minIncrement: Number(minIncrement),
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          directPurchaseEnabled,
          directPurchasePrice: directPurchaseEnabled ? Number(directPurchasePrice) : null,
        }),
      });
      push(t("admin.auctionCreated"), "success");
      router.push(`/admin/auctions/${created._id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("admin.auctionCreateFailed"));
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
              <PlateRenderer
                type={selectedPlate.type}
                lettersAr={selectedPlate.lettersAr}
                lettersEn={selectedPlate.lettersEn}
                numbers={selectedPlate.numbers}
                logo={selectedPlate.logo}
                size="md"
                locale={locale}
              />
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">
                  {t("admin.fieldPlate")}
                  <span className="text-(--color-gold) ms-0.5" aria-hidden="true">*</span>
                </span>
                <select
                  value={plateId}
                  onChange={(e) => setPlateId(e.target.value)}
                  required
                  className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
                >
                  <option value="">{t("admin.choosePlate")}</option>
                  {plates.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.lettersAr} {p.numbers} ({p.lettersEn})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-(--color-text)">{t("admin.fieldCategory")}</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AuctionCategory)}
                  className="h-10 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-bg-elevated) px-3 text-sm text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
                >
                  {AUCTION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "exclusive" ? t("auction.exclusiveBadge") : t("admin.categoryRegular")}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("admin.sectionPricing")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("admin.fieldStartingPrice")}
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  required
                />
                <Input
                  label={t("admin.fieldMinIncrement")}
                  type="number"
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                  required
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
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
                <Input
                  label={t("admin.fieldEndTime")}
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-faint)">{t("admin.sectionPurchase")}</h2>
              <label className="flex items-center gap-2.5 text-sm text-(--color-text)">
                <input
                  type="checkbox"
                  checked={directPurchaseEnabled}
                  onChange={(e) => setDirectPurchaseEnabled(e.target.checked)}
                  className="h-4 w-4 accent-(--color-gold)"
                />
                {t("admin.enableDirectPurchase")}
              </label>

              {directPurchaseEnabled && (
                <Input
                  label={t("admin.fieldDirectPurchasePrice")}
                  type="number"
                  value={directPurchasePrice}
                  onChange={(e) => setDirectPurchasePrice(e.target.value)}
                  required
                  error={error ?? undefined}
                />
              )}
            </div>

            {!directPurchaseEnabled && error && <p className="text-sm text-(--color-danger)">{error}</p>}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="mt-1">
              {t("admin.createAuctionSubmit")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
