"use client";

import { useEffect } from "react";

const PINGED_FLAG = "mazad_visit_pinged";

/**
 * Renders nothing — fires one POST /api/stats/visit per browser tab per
 * session on mount. The sessionStorage flag only saves a redundant
 * request on same-tab reloads/navigations (this layout persists across
 * client-side navigations within the (public) group); the real
 * once-per-day-per-visitor guard is the unique DB index in PageVisit,
 * not this flag.
 */
export function VisitorPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PINGED_FLAG)) return;
      sessionStorage.setItem(PINGED_FLAG, "1");
    } catch {
      // Private browsing / storage blocked — fall through and ping anyway;
      // worst case is one extra (still deduped server-side) request.
    }
    fetch("/api/stats/visit", { method: "POST", credentials: "same-origin" }).catch(() => {});
  }, []);

  return null;
}
