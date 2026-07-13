import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "uk.co.rowanrose.portal",
  appName: "Rowan Rose",
  // Vite build output. `npm run mobile:build` writes the service-worker-free
  // bundle here, then `cap sync` copies it into the native projects.
  webDir: "dist",
  server: {
    // Cap 8 default — serves the app from https://localhost so the WebView is a
    // secure context (localStorage, crypto, the app's "rr-theme" bootstrap).
    androidScheme: "https",
    // Live-reload: set CAP_SERVER_URL (e.g. http://192.168.1.2:5173) before
    // `npx cap sync android` to make the native app load from the running Vite
    // dev server — code changes then hot-reload on the device with no rebuild
    // or reinstall. NEVER set this for a release/distribution build.
    ...(process.env.CAP_SERVER_URL
      ? { url: process.env.CAP_SERVER_URL, cleartext: true }
      : {}),
  },
  plugins: {
    SplashScreen: {
      // We hide the splash from JS once React paints (see main.tsx), so don't
      // auto-hide on a timer — that would flash white before first paint.
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: "#f8f9fe", // matches the app's light background_color
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      // Android 15+ / targetSDK 36 enforces edge-to-edge (can't opt out), so the
      // WebView always draws under the status bar. We embrace that and pad with
      // CSS safe-area insets (MobileHeader/AuthLayout). Icon colour is synced to
      // the active theme at runtime in ThemeProvider. backgroundColor is ignored
      // under edge-to-edge, so it's omitted.
      overlaysWebView: true,
      style: "LIGHT",
    },
  },
};

export default config;
