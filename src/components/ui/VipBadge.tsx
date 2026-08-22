"use client";

import { Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export function VipBadge({ className }: { className?: string }) {
  const { t } = useTranslations();
  return (
    <Badge tone="vip" className={className}>
      <Crown className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
      {t("auction.vipBadge")}
    </Badge>
  );
}

export function ExclusiveBadge({ className }: { className?: string }) {
  const { t } = useTranslations();
  return (
    <Badge tone="gold" className={className}>
      <Sparkles className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
      {t("auction.exclusiveBadge")}
    </Badge>
  );
}
