"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
}

export function Pagination({ page, pages, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-(--color-border) px-4 py-3">
      <p className="text-xs text-(--color-text-muted)">
        <span className="tnum">{total}</span> {t("common.resultsCount")} —{" "}
        {t("common.pageIndicator", { page, pages })}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          {t("common.previous")}
        </Button>
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => goToPage(page + 1)}>
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
