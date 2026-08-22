import type { PlateLogoDTO } from "@/types/dto";
import type { Locale } from "@/lib/i18n";

interface PlateLogoIconProps {
  logo: PlateLogoDTO | null;
  className?: string;
  locale?: Locale;
}

/**
 * Renders the admin-managed logo's own uploaded image. Logos are no longer
 * code-defined SVGs keyed by an enum — see src/models/PlateLogo.ts — so
 * this is just an <img>, not a switch/case over known values.
 */
export function PlateLogoIcon({ logo, className, locale = "ar" }: PlateLogoIconProps) {
  if (!logo) return null;

  const name = locale === "en" ? logo.nameEn : logo.nameAr;

  // Plate chrome is rendered at small, fixed sizes inline with text;
  // next/image's responsive-loader overhead isn't worth it here (matches
  // the plate's other hand-drawn chrome, which is also plain markup).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logo.image} alt={name} className={className} />;
}
