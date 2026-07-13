import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Native (Capacitor) builds set CAP_BUILD=1. A Workbox service worker inside a
// native WebView causes stale-cache white-screens after an app update (the SW
// serves the old cached shell while the bundled assets have changed), and the
// native app already ships its own asset bundle — so the PWA plugin is omitted
// for native builds. The web build is unaffected and keeps the installable PWA.
const isCapacitor = process.env.CAP_BUILD === "1";

export default defineConfig({
  plugins: [
    react(),
    ...(isCapacitor
      ? []
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],
            manifest: {
              name: "Rowan Rose — Client Portal",
              short_name: "Rowan Rose",
              description: "Track your claim, upload documents and review offers with Fast Action Claims.",
              theme_color: "#003c60",
              background_color: "#f8f9fe",
              display: "standalone",
              start_url: "/",
              icons: [
                // SVG for browsers that support it; PNGs for iOS/Android installers.
                { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
                { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                // Full-bleed icon for Android adaptive/maskable masking.
                { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
              ],
            },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Pre-bundle every runtime dependency at server start. Without this, Vite
  // discovers a dep the first time a route imports it (e.g. fuse.js on /faq,
  // @floating-ui/react on a glossary popover), re-runs optimizeDeps mid-session
  // and force-reloads — the in-flight route 504s ("Outdated Optimize Dep") and
  // renders BLANK until a manual refresh. Listing them here means no mid-session
  // re-optimization ever happens, so tabs stop going blank. This is the fix.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "framer-motion",
      "fuse.js",
      "@floating-ui/react",
      "clsx",
      "tailwind-merge",
      // Dynamically imported on native (splash hide, status-bar theme sync,
      // Android back button). Pre-bundle them too, or the dev server discovers
      // them on first theme-change / navigation, re-optimizes mid-session and
      // force-reloads to a BLANK screen (see the note above).
      "@capacitor/core",
      "@capacitor/app",
      "@capacitor/status-bar",
      "@capacitor/splash-screen",
    ],
  },
});
