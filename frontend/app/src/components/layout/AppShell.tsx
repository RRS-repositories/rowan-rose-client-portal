import { useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
 * Routes that must fill the viewport exactly rather than grow with their
 * content — chat, where the composer stays put and only the thread scrolls.
 * <main> normally has no height at all, so a page asking for h-full got
 * nothing and the whole document scrolled instead. Giving main a real height
 * here is the single source of it: border-box means the mobile bottom-tab
 * padding is subtracted for free, so the page inside just says h-full and
 * never hard-codes a pixel guess.
 */
const FULL_HEIGHT_ROUTE = /^\/chat(\/|$)/;

/**
 * App frame. Desktop = left folder-tab sidebar + wide content; mobile = each
 * screen's own MobileHeader + a bottom tab bar. Splash and auth routes are bare.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Android hardware back button → router history (native/Capacitor only).
  // Without this the WebView back button exits the app instead of navigating
  // back. Registered once; refs keep the handler reading the current path and
  // navigate. No-op on web. Must run before the BARE_ROUTES early return so the
  // hook order stays stable.
  const navRef = useRef(navigate);
  navRef.current = navigate;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        const p = pathRef.current;
        if (p === "/dashboard" || p === "/") void App.exitApp();
        else if (canGoBack) navRef.current(-1);
        else navRef.current("/dashboard");
      });
      if (cancelled) void handle.remove();
      else cleanup = () => void handle.remove();
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

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
            `position: sticky` cards, which breaks their pinning. Full-height
            routes take the other branch: fixed to the viewport and clipped on
            both axes, so scrolling happens inside the page, not on the document.
            (They have no sticky right column, so the caveat above doesn't bite.) */}
        <main
          id="main"
          className={
            FULL_HEIGHT_ROUTE.test(pathname)
              ? "h-dvh min-w-0 flex-1 overflow-hidden pb-[var(--rr-tabbar-h,120px)] md:pb-0"
              : "min-w-0 flex-1 overflow-x-clip pb-[120px] md:overflow-x-visible md:pb-0"
          }
        >
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
