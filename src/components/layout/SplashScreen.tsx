"use client";

import { useEffect, useState } from "react";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { cn } from "@/lib/cn";

const MIN_VISIBLE_MS = 1800;
const MAX_VISIBLE_MS = 6500;

async function waitForPageAssets() {
  if (document.readyState !== "complete") {
    await new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
  }

  await document.fonts?.ready.catch(() => undefined);

  const images = Array.from(document.images).filter((image) => image.currentSrc || image.src);
  await Promise.allSettled(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }
      await image.decode?.().catch(() => undefined);
    })
  );
}

export function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const startedAt = performance.now();
    let cancelled = false;

    document.documentElement.classList.add("overflow-hidden");

    const finish = async () => {
      await Promise.race([
        waitForPageAssets(),
        new Promise<void>((resolve) => window.setTimeout(resolve, MAX_VISIBLE_MS)),
      ]);

      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, MIN_VISIBLE_MS - elapsed));
      }

      if (cancelled) return;
      setLeaving(true);
      window.setTimeout(() => {
        if (cancelled) return;
        setHidden(true);
        document.documentElement.classList.remove("overflow-hidden");
      }, 520);
    };

    finish();

    return () => {
      cancelled = true;
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] isolate flex items-center justify-center overflow-hidden bg-black text-white transition-opacity duration-500",
        leaving && "pointer-events-none opacity-0"
      )}
      aria-busy={!leaving}
      aria-live="polite"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/herosection.mp4"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        poster="/images/bg-hero.webp"
      />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,.05),rgba(0,0,0,.72))]" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <MazadLogo className="h-24 w-[8.75rem] sm:h-32 sm:w-[11.5rem]" />
        <div className="h-1.5 w-52 overflow-hidden rounded-full bg-white/20">
          <span className="block h-full w-1/2 animate-[splash-progress_1.35s_ease-in-out_infinite] rounded-full bg-(--color-gold)" />
        </div>
        <p className="text-sm font-semibold text-white/90">جار تجهيز الموقع...</p>
      </div>
    </div>
  );
}
