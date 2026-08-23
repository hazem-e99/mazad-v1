"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scroll state for a native horizontal track.
 *
 * The home page's carousels are plain `overflow-x-auto` flex rows — real
 * scroll containers, so they swipe, keep momentum, and work with a
 * trackpad or a keyboard before any of this runs. What they cannot do on
 * their own is *say* that more is off-screen, which is what the page
 * arrows and dots are for.
 *
 * Pages are measured from the track rather than from an item count: how
 * many tiles fit changes with the breakpoint, and reading it back from
 * `scrollWidth / clientWidth` means the dots stay right without the
 * component restating its own responsive widths in JavaScript.
 *
 * RTL note: in every current engine a right-to-left scroller starts at
 * `scrollLeft === 0` and goes *negative* toward the end, so distances are
 * taken as absolute values and only the sign of a scroll instruction is
 * flipped.
 */
export function useCarousel<T extends HTMLElement>(rtl: boolean, deps: unknown[] = []) {
  const ref = useRef<T>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const width = node.clientWidth;
      if (width === 0) return;
      // A half-tile of overhang is still a page worth scrolling to; a few
      // stray pixels from rounding is not.
      const total = Math.max(1, Math.ceil((node.scrollWidth - 4) / width));
      setPages(total);
      setPage(Math.min(total - 1, Math.round(Math.abs(node.scrollLeft) / width)));
    };

    measure();
    node.addEventListener("scroll", measure, { passive: true });
    // Fonts, images and breakpoint changes all resize the track after the
    // first measurement, and each one changes how many pages there are.
    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToPage = useCallback(
    (index: number) => {
      const node = ref.current;
      if (!node) return;
      const target = index * node.clientWidth * (rtl ? -1 : 1);
      node.scrollTo({ left: target, behavior: "smooth" });
    },
    [rtl]
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      const node = ref.current;
      if (!node) return;
      node.scrollBy({ left: node.clientWidth * direction * (rtl ? -1 : 1), behavior: "smooth" });
    },
    [rtl]
  );

  return {
    ref,
    pages,
    page,
    step,
    scrollToPage,
    /** True while there is more track in that direction — lets the arrows
     * dim at the ends instead of looking broken when they do nothing. */
    canPrev: page > 0,
    canNext: page < pages - 1,
  };
}
