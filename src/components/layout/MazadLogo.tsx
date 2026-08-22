import { cn } from "@/lib/cn";

/**
 * The Mazad mark: the Arabic letter م on a brushed-gold tile. The glyph is
 * sized as a share of the tile's own width (`cqi`), so a single component
 * is correct as a 32px footer mark and a 44px navbar mark — callers only
 * ever set the box size.
 */
export function MazadLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "@container relative flex shrink-0 items-center justify-center overflow-hidden rounded-(--radius-md)",
        "bg-linear-to-b from-(--color-gold-hover) to-(--color-gold-dark)",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_6px_16px_-8px_rgba(236,189,51,.6)]",
        className
      )}
      aria-hidden="true"
    >
      <span className="text-[54cqi] font-bold leading-none text-(--color-gold-foreground)">م</span>
    </span>
  );
}
