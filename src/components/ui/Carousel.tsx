"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/cn";

interface CarouselProps {
  children: ReactNode;
  /** Accessible name for the scroll region. */
  label: string;
  className?: string;
  /** Rendered in place of the default overlay steppers — pass the result
   * of `useCarousel` controls into a SectionHeader instead. */
  hideControls?: boolean;
}

/**
 * A native scroll container with CSS snap points, plus optional arrow
 * steppers. Scrolling is the browser's — so touch, trackpad, keyboard and
 * momentum all behave exactly as the platform does — and the arrows only
 * nudge `scrollLeft`, which is why there is no transform-based track to
 * fall out of sync on resize.
 *
 * Under RTL `scrollLeft` runs negative in every current engine, so the
 * component reasons about *absolute* distance from the start edge and
 * lets the sign fall out of the direction.
 */
export function Carousel({ children, label, className, hideControls }: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslations();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const offset = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(offset <= 4);
    setAtEnd(offset >= max - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el) return;
      // Advance by roughly one viewport of cards, less a card's overlap so
      // the user keeps a visual anchor between pages.
      const distance = Math.max(240, el.clientWidth * 0.8);
      const sign = locale === "ar" ? -1 : 1;
      el.scrollBy({ left: direction * distance * sign, behavior: "smooth" });
    },
    [locale]
  );

  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className={cn("group/carousel relative", className)}>
      <div
        ref={scrollerRef}
        onScroll={sync}
        className="mz-scroller -mx-1 flex gap-5 overflow-x-auto px-1 pb-2"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {children}
      </div>

      {!hideControls && (
        <>
          <CarouselArrow side="start" onClick={() => step(-1)} disabled={atStart} label={t("common.previous")}>
            <Prev className="h-5 w-5" aria-hidden="true" />
          </CarouselArrow>
          <CarouselArrow side="end" onClick={() => step(1)} disabled={atEnd} label={t("common.next")}>
            <Next className="h-5 w-5" aria-hidden="true" />
          </CarouselArrow>
        </>
      )}
    </div>
  );
}

function CarouselArrow({
  side,
  onClick,
  disabled,
  label,
  children,
}: {
  side: "start" | "end";
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 hidden -translate-y-1/2 shadow-(--shadow-card) md:inline-flex",
        // Steppers stay out of the way until the section is engaged with,
        // so a resting page shows plates, not chrome.
        "opacity-0 transition-opacity duration-(--duration-base) group-hover/carousel:opacity-100 focus-visible:opacity-100",
        side === "start" ? "-start-3" : "-end-3"
      )}
    >
      {children}
    </IconButton>
  );
}
