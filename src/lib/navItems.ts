import {
  Crown,
  ExternalLink,
  Gavel,
  Home,
  IdCard,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/constants";
import type { SiteNavItem } from "@/lib/siteSettings";

export interface HeaderViewer {
  role: UserRole;
  isStaff: boolean;
}

export interface NavItem {
  href: string;
  /** Key into the message catalog — resolved by whichever component
   * renders the item, so one definition serves both languages. */
  labelKey?: string;
  labelAr?: string;
  labelEn?: string;
  icon: LucideIcon;
}

type Translate = (key: string) => string;

/**
 * The site's navigation, defined once.
 *
 * The hero on the home page opens its own drawer while every other page
 * uses the sticky header, and both need the same destinations. Keeping
 * the list here is what stops the two from drifting — a route added to
 * one used to be missing from the other.
 *
 * Every href is a real route under src/app; nothing here is decorative.
 */
function iconForHref(href: string): LucideIcon {
  if (href === "/") return Home;
  if (href.startsWith("/auctions/exclusive")) return Sparkles;
  if (href.startsWith("/auctions")) return Gavel;
  if (href.startsWith("/vip")) return Crown;
  if (href.startsWith("/account/plates") || href.startsWith("/my-listings")) return IdCard;
  if (href.startsWith("/listings")) return Store;
  if (href.startsWith("/ads")) return Megaphone;
  if (href.startsWith("/chat")) return MessageCircle;
  if (href.startsWith("/admin")) return LayoutDashboard;
  return ExternalLink;
}

function audienceAllows(item: SiteNavItem, viewer: HeaderViewer | null): boolean {
  if (!item.enabled) return false;
  if (item.audience === "auth") return Boolean(viewer);
  if (item.audience === "staff") return Boolean(viewer?.isStaff);
  return true;
}

export function mainNavItems(viewer: HeaderViewer | null, configuredItems?: SiteNavItem[]): NavItem[] {
  if (configuredItems?.length) {
    return configuredItems
      .filter((item) => audienceAllows(item, viewer))
      .map((item) => ({
        href: item.href,
        labelAr: item.labelAr,
        labelEn: item.labelEn,
        icon: iconForHref(item.href),
      }));
  }

  return [
    { href: "/", labelKey: "nav.home", icon: Home },
    { href: "/auctions", labelKey: "nav.auctions", icon: Gavel },
    { href: "/listings", labelKey: "nav.marketplace", icon: Store },
    { href: "/auctions/exclusive", labelKey: "nav.exclusive", icon: Sparkles },
    { href: "/vip", labelKey: "nav.vip", icon: Crown },
    ...(viewer ? [{ href: "/my-listings", labelKey: "nav.myPlates", icon: IdCard }] : []),
    { href: "/ads", labelKey: "nav.ads", icon: Megaphone },
    { href: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  ];
}

export function accountNavItems(viewer: HeaderViewer | null): NavItem[] {
  return [
    { href: "/account", labelKey: "nav.myAccount", icon: UserRound },
    { href: "/my-listings", labelKey: "nav.myPlates", icon: IdCard },
    { href: "/account/bids", labelKey: "nav.myBids", icon: TrendingUp },
    ...(viewer?.isStaff ? [{ href: "/admin", labelKey: "nav.dashboard", icon: LayoutDashboard }] : []),
  ];
}

/** Home is only "active" on an exact match; every other entry owns its
 * whole subtree, so /auctions/exclusive still lights up "المزادات". */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export const navLabel = (t: Translate, item: NavItem, locale: "ar" | "en" = "ar") =>
  item.labelKey ? t(item.labelKey) : locale === "en" ? item.labelEn ?? item.labelAr ?? item.href : item.labelAr ?? item.labelEn ?? item.href;
