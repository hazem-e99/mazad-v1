import {
  Crown,
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

export interface HeaderViewer {
  role: UserRole;
  isStaff: boolean;
}

export interface NavItem {
  href: string;
  /** Key into the message catalog — resolved by whichever component
   * renders the item, so one definition serves both languages. */
  labelKey: string;
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
export function mainNavItems(viewer: HeaderViewer | null): NavItem[] {
  return [
    { href: "/", labelKey: "nav.home", icon: Home },
    { href: "/auctions", labelKey: "nav.auctions", icon: Gavel },
    { href: "/listings", labelKey: "nav.marketplace", icon: Store },
    { href: "/auctions/exclusive", labelKey: "nav.exclusive", icon: Sparkles },
    { href: "/vip", labelKey: "nav.vip", icon: Crown },
    ...(viewer ? [{ href: "/account/plates", labelKey: "nav.myPlates", icon: IdCard }] : []),
    { href: "/ads", labelKey: "nav.ads", icon: Megaphone },
    { href: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  ];
}

export function accountNavItems(viewer: HeaderViewer | null): NavItem[] {
  return [
    { href: "/account", labelKey: "nav.myAccount", icon: UserRound },
    { href: "/account/plates", labelKey: "nav.myPlates", icon: IdCard },
    { href: "/account/bids", labelKey: "nav.myBids", icon: TrendingUp },
    ...(viewer?.isStaff ? [{ href: "/admin", labelKey: "nav.dashboard", icon: LayoutDashboard }] : []),
  ];
}

/** Home is only "active" on an exact match; every other entry owns its
 * whole subtree, so /auctions/exclusive still lights up "المزادات". */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export const navLabel = (t: Translate, item: NavItem) => t(item.labelKey);
