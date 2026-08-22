import { Crown, ArrowLeft } from "lucide-react";
import Image from "next/image";
import bannerImage from "../../../public/images/banner.png";
import { LinkButton } from "@/components/ui/Button";

export function PromotionalBanner() {
  return (
    <section
      className="mz-reveal relative isolate mb-16 aspect-[2/1] w-full overflow-hidden border-y border-(--color-gold)/25 bg-center bg-no-repeat sm:mb-20 sm:border lg:aspect-auto lg:h-[380px]"
      style={{ backgroundImage: `url(${bannerImage.src})`, backgroundSize: "100% 100%" }}
      dir="rtl"
      aria-labelledby="promotional-banner-title"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-black/20"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute left-[3%] top-[46%] z-10 aspect-[4.35/1] w-[30%] max-w-[21rem] min-w-[10rem] -rotate-1 drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)] sm:left-[9%] sm:w-[29%] lg:top-[46%] lg:w-[30%]">
        <Image
          src="/images/License1.png"
          alt="لوحة مميزة"
          fill
          sizes="30vw"
          className="object-contain"
        />
      </div>

      <div
        className="relative z-20 mx-auto flex h-full w-[88%] max-w-[38rem] items-center justify-center px-0 py-8 text-center sm:w-[52%] sm:py-10 lg:w-[40%]"
      >
        <div className="flex max-w-[24rem] flex-col items-center">
          <Crown className="animate-rise-in mb-3 h-5 w-5 text-(--color-gold) sm:h-6 sm:w-6" aria-hidden="true" />
          <h2 id="promotional-banner-title" className="animate-rise-in text-2xl font-bold leading-tight text-white sm:text-4xl">
            مزاد اللوحات
            <span className="mt-1 block text-(--color-gold)">فرصتك تملك الآن</span>
          </h2>
          <p className="mt-4 max-w-[22rem] text-sm leading-7 text-white/80 sm:text-base">
            لوحات مميزة لأرقام استثنائية تبدأ من هنا
          </p>
          <LinkButton
            href="/auctions"
            variant="gold"
            size="md"
            className="animate-rise-in mt-6 min-w-44 shadow-[0_6px_18px_-10px_rgba(236,189,51,0.9)]"
          >
            استكشف المزادات
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
