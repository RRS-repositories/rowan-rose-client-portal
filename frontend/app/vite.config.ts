import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Rowan Rose — Client Portal",
        short_name: "Rowan Rose",
        description: "Track your claim, upload documents and review offers with Fast Action Claims.",
        theme_color: "#003c60",
        background_color: "#f8f9fe",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      devOptions: { enabled: false },
    }),
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
    ],
  },
});
