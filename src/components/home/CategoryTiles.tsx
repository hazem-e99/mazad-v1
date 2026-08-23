"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Tag } from "lucide-react";
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
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section aria-labelledby="categories-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="categories-title" className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
            {t("home.categoriesTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-(--color-text-muted)">{t("home.categoriesSubtitle")}</p>
        </div>
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-pill) border border-(--color-border-strong) px-4 text-sm font-semibold text-(--color-text-muted) transition-colors hover:border-(--color-gold)/55 hover:text-(--color-gold) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        >
          {t("home.categoriesViewAll")}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mz-scroller -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {categories.map((category) => (
          <li key={category._id} className="mz-snap w-36 shrink-0 sm:w-auto">
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
