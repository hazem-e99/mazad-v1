"use client";

import { useState } from "react";
import { Camera, ClipboardCheck, Banknote, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { useTranslations } from "@/components/i18n/LocaleProvider";

/**
 * Mandatory read-and-acknowledge gate shown to a regular user before the
 * "add a plate" wizard — never to staff (see PlateListingForm's `isAdmin`
 * branch, which skips rendering this entirely). Purely a client-side
 * checkpoint: the moderation queue this leads into is the real gate, this
 * only sets expectations up front so fewer submissions land there missing
 * an ownership document or a usable photo.
 */
export function PreSubmitTipsGate({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslations();
  const [agreed, setAgreed] = useState(false);

  const tips = [
    { icon: Camera, title: t("pages.tipRealPhotoTitle"), body: t("pages.tipRealPhotoBody") },
    { icon: ClipboardCheck, title: t("pages.tipAccurateDataTitle"), body: t("pages.tipAccurateDataBody") },
    { icon: Banknote, title: t("pages.tipRealisticPriceTitle"), body: t("pages.tipRealisticPriceBody") },
    { icon: Bell, title: t("pages.tipTrackOffersTitle"), body: t("pages.tipTrackOffersBody") },
    { icon: ShieldCheck, title: t("pages.tipReviewBeforePublishTitle"), body: t("pages.tipReviewBeforePublishBody") },
  ];

  return (
    <div className="mz-container max-w-3xl py-10">
      <div className="mz-edge-gold relative overflow-hidden rounded-(--radius-xl) border border-(--color-border) bg-(--color-bg-elevated) p-5 sm:p-8">
        <span aria-hidden="true" className="mz-glow-gold pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-(--color-text) sm:text-3xl">{t("pages.preSubmitTipsTitle")}</h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">{t("pages.preSubmitTipsSubtitle")}</p>

          <div className="mt-6 flex flex-col gap-3">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="flex gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4"
              >
                <tip.icon className="mt-0.5 h-5 w-5 shrink-0 text-(--color-gold)" aria-hidden="true" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="font-semibold text-(--color-text)">{tip.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Checkbox
              id="pre-submit-tips-agree"
              label={t("pages.preSubmitTipsAgree")}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="gold" size="lg" disabled={!agreed} onClick={onContinue}>
              {t("pages.preSubmitTipsContinue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
