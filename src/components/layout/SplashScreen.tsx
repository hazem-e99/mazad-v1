"use client";

import { useEffect, useRef, useState } from "react";
import { MazadLogo } from "@/components/layout/MazadLogo";
import { cn } from "@/lib/cn";

const VISIBLE_MS = 5_000;
const VIDEO_PLAYBACK_RATE = 2;
const SEEN_KEY = "mazad_splash_seen";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = window.sessionStorage.getItem(SEEN_KEY) === "1";
      if (!alreadySeen) window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      alreadySeen = false;
    }

    if (alreadySeen) {
      setHidden(true);
    } else {
      setShouldRender(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    let cancelled = false;

    document.documentElement.classList.add("overflow-hidden");

    const finish = async () => {
      void waitForPageAssets();
      await new Promise<void>((resolve) => window.setTimeout(resolve, VISIBLE_MS));

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

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = VIDEO_PLAYBACK_RATE;
  }, []);

  if (!shouldRender || hidden) return null;

  const speedUpVideo = (video: HTMLVideoElement | null) => {
    if (video) video.playbackRate = VIDEO_PLAYBACK_RATE;
  };

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
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/herosection.mp4"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        poster="/images/bg-hero.webp"
        onLoadedMetadata={(event) => speedUpVideo(event.currentTarget)}
        onCanPlay={(event) => speedUpVideo(event.currentTarget)}
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
