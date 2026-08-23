"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { formatNumber } from "@/lib/format";
import type { HomeCategory } from "@/lib/queries";

/**
 * "الأقسام الرئيسية" — the categories the admin manages, nothing else.
 *
 * There is no hardcoded taxonomy behind this row: the tiles are the
 * PlateCategory records with `isActive: true`, in the admin's own
 * `sortOrder`. Adding, renaming, reordering or deactivating a category in
 * /admin/plate-categories changes this section with no code edit, which
 * is the whole reason the category manager exists.
 *
 * Each tile links into /listings?category=<id>, a filter that page
 * already implements server-side, so the destination is a real filtered
 * query rather than a page that ignores the parameter.
 *
 * The artwork is the admin's own upload, carried on the category record
 * and served straight from `category.image`. Nothing here maps a name to a
 * picture: a category the admin has not given artwork to falls back to the
 * shared tag icon rather than borrowing someone else's image.
 */
export function CategoryTiles({ categories }: { categories: HomeCategory[] }) {
  const { t, locale } = useTranslations();
  const scroller = useRef<HTMLUListElement>(null);
  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  // The track scrolls in the document's own direction: in RTL, advancing
  // to the next tile *decreases* scrollLeft. Flipping the sign here keeps
  // "next" meaning next in both directions.
  const step = (direction: -1 | 1) => {
    const node = scroller.current;
    if (!node) return;
    const amount = Math.max(200, node.clientWidth * 0.6) * direction * (isArabic ? -1 : 1);
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  // "Previous" points back the way the text runs — a right chevron in
  // Arabic, a left one in English.
  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <section aria-labelledby="categories-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="categories-title" className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
            {t("home.categoriesTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-(--color-text-muted)">{t("home.categoriesSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/listings"
            className="inline-flex h-10 items-center gap-2 rounded-(--radius-pill) border border-(--color-border-strong) px-4 text-sm font-semibold text-(--color-text-muted) transition-colors hover:border-(--color-gold)/55 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          >
            {t("home.categoriesViewAll")}
            <Arrow className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Beside the heading rather than over the tiles: unlike the
              featured panel, this row sits on the page canvas, where a
              floating disc would have nothing to float above. */}
          {categories.length > 1 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <StepButton onClick={() => step(-1)} label={t("common.previous")}>
                <PrevIcon className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
              </StepButton>
              <StepButton onClick={() => step(1)} label={t("common.next")}>
                <NextIcon className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
              </StepButton>
            </div>
          )}
        </div>
      </div>

      {/* One scrolling track at every width — never a wrapping grid, which
          left a ragged second row whenever the admin's category count was
          not an exact multiple of the column count. */}
      <ul ref={scroller} className="mz-scroller -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:gap-4">
        {categories.map((category) => (
          <li
            key={category._id}
            className="mz-snap w-36 shrink-0 sm:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
          >
            <Link
              href={`/listings?category=${category._id}`}
              className="mz-hover-lift flex h-full flex-col items-center gap-2.5 rounded-(--radius-lg) border border-(--color-border-light) bg-(--color-surface-secondary) px-3 py-5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
            >
              <CategoryArtwork src={category.image} />
              <span className="text-sm font-semibold leading-snug text-(--color-text)">
                {locale === "en" ? category.nameEn : category.nameAr}
              </span>
              <span className="tnum text-[11px] text-(--color-text-faint)">
                {/* Formatted before interpolation so the digits are
                    Arabic-Indic alongside every other number on the page —
                    passing the raw count would print Latin ones. */}
                {t("home.categoryPlateCount", { count: formatNumber(category.plateCount, locale) })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-text-muted) transition-colors duration-(--duration-fast) hover:border-(--color-gold)/55 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
    >
      {children}
    </button>
  );
}

/**
 * The tile's visual. `object-contain` on a fixed-height, full-width box:
 * category uploads are arbitrary aspect ratios, and `cover` would crop the
 * subject out of a wide or tall image. The height is fixed but the width is
 * not, so nothing is ever squashed.
 *
 * Decorative — the tile's own label names the category — hence the empty
 * alt on both branches.
 */
function CategoryArtwork({ src }: { src: string | null }) {
  // A stored path is not proof the file is there: uploads live on local
  // disk outside git, so a database shared between machines can carry a
  // path whose file this one never received. Falling back on error keeps
  // the tile intact instead of showing a broken image.
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className="flex h-16 w-16 items-center justify-center rounded-(--radius-md) bg-(--color-surface) text-(--color-gold-dark) shadow-(--shadow-soft)"
        aria-hidden="true"
      >
        <Tag className="h-6 w-6" strokeWidth={1.9} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-16 w-full object-contain sm:h-20"
    />
  );
}
