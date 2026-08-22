"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PlateLogoDTO } from "@/types/dto";

/** Fetches the active plate-logo list once (public-safe endpoint — never
 * includes inactive logos). Shared by every plate-creation form and the
 * logo selector so the list is only fetched once per page. */
export function usePlateLogos() {
  const [logos, setLogos] = useState<PlateLogoDTO[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: PlateLogoDTO[] }>("/api/plate-logos")
      .then((res) => {
        if (!cancelled) setLogos(res.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { logos, loading: logos === null && !loadError, loadError };
}
