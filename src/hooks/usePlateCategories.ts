"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PlateCategoryDTO } from "@/types/dto";

export function usePlateCategories() {
  const [categories, setCategories] = useState<PlateCategoryDTO[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: PlateCategoryDTO[] }>("/api/plate-categories")
      .then((res) => { if (!cancelled) setCategories(res.items); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);
  return { categories, loading: categories === null && !loadError, loadError };
}
