"use client";

import { Badge } from "@/components/ui/Badge";
import { statusTone, statusKey } from "@/lib/auctionStatus";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { AuctionStatus } from "@/lib/constants";

export function AuctionStatusBadge({
  status,
  className,
}: {
  status: AuctionStatus;
  className?: string;
}) {
  const { t } = useTranslations();
  const tone = statusTone[status] ?? "neutral";
  const key = statusKey[status];

  return (
    <Badge tone={tone} dot={status === "live"} className={className}>
      {key ? t(key) : status}
    </Badge>
  );
}
