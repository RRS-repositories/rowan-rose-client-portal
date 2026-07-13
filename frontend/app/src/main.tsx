import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";

// Light fonts
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
// Dark fonts
import "@fontsource/literata/400.css";
import "@fontsource/literata/600.css";
import "@fontsource/literata/700.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "@fontsource/hanken-grotesk/700.css";
import "material-symbols/outlined.css";

import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/skeuomorphism.css";

import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import { FontSizeProvider } from "./theme/FontSizeProvider";
import { ToastProvider } from "./components/ui/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontSizeProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BrowserRouter>
        </MotionConfig>
      </FontSizeProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Native (Capacitor) only: hide the launch splash once React has painted, so
// there's no white flash between the native splash and first paint. No-op on
// web — Capacitor.isNativePlatform() is false and the imports just resolve to
// stubs. Dynamic so the web bundle isn't weighed down by native plugin code.
void import("@capacitor/core").then(({ Capacitor }) => {
  if (!Capacitor.isNativePlatform()) return;
  void import("@capacitor/splash-screen").then(({ SplashScreen }) =>
    requestAnimationFrame(() => void SplashScreen.hide()),
  );
});
