import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SideNav } from "./SideNav";
import { BottomTabBar } from "./BottomTabBar";

/** Routes rendered full-screen without the app chrome (no sidebar / tab bar /
 *  skip link): the splash screen and the auth flow, which carry their own layout. */
const BARE_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/verify-otp",
  "/create-password",
  "/complete-profile",
  "/forgot-password",
  "/check-email",
  "/reset-password",
  "/password-reset-success",
]);

/**
 * App frame. Desktop = left folder-tab sidebar + wide content; mobile = each
 * screen's own MobileHeader + a bottom tab bar. Splash and auth routes are bare.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (BARE_ROUTES.has(pathname)) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-[1700px]">
        <SideNav />
        {/* Clip horizontal overflow on MOBILE only: the mobile page transition
            slides with translateX, which would otherwise flash a horizontal
            scrollbar mid-transition. On desktop the transition is vertical, so we
            must NOT clip — clipping here makes an ancestor of the right-column
            `position: sticky` cards, which breaks their pinning. */}
        <main id="main" className="min-w-0 flex-1 overflow-x-clip pb-[120px] md:overflow-x-visible md:pb-0">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}

/** Per-screen content container — fills the available width (the sidebar already
 *  constrains the left on desktop). */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full px-margin-mobile py-md md:px-lg md:py-lg ${className ?? ""}`}>{children}</div>
  );
}
