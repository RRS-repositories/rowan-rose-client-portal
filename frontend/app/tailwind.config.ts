import type { Config } from "tailwindcss";

/**
 * Modern Jurist — dual theme. Colour token NAMES + fonts map to CSS variables
 * (src/styles/tokens.css) so Light (Steel Blue / Plus Jakarta+Be Vietnam) and
 * Refined Dark (Emerald / Literata+Hanken) swap by re-pointing the variables.
 * Radii / spacing / type scale match the Stitch light config.
 */
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const colorTokens = [
  "background", "surface", "surface-bright", "surface-dim",
  "surface-container-lowest", "surface-container-low", "surface-container",
  "surface-container-high", "surface-container-highest", "surface-variant",
  "on-surface", "on-surface-variant", "on-background", "outline", "outline-variant",
  "primary", "on-primary", "primary-container", "on-primary-container",
  "primary-fixed", "primary-fixed-dim", "on-primary-fixed", "on-primary-fixed-variant", "inverse-primary",
  "secondary", "on-secondary", "secondary-container", "on-secondary-container",
  "secondary-fixed", "secondary-fixed-dim", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
  "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary-fixed", "on-tertiary-fixed-variant",
  "error", "on-error", "error-container", "on-error-container",
  "inverse-surface", "inverse-on-surface", "surface-tint",
];

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: Object.fromEntries(colorTokens.map((t) => [t, c(`--c-${t}`)])),
      fontFamily: {
        display: ["var(--font-display)"],
        "display-lg": ["var(--font-display)"],
        "display-lg-mobile": ["var(--font-display)"],
        "headline-md": ["var(--font-display)"],
        headline: ["var(--font-display)"],
        body: ["var(--font-body)"],
        "body-lg": ["var(--font-body)"],
        "body-md": ["var(--font-body)"],
        "label-caps": ["var(--font-body)"],
        label: ["var(--font-body)"],
        button: ["var(--font-body)"],
      },
      // Type scale in rem (÷18, the html base) so the FontSizeProvider's root
      // font-size lever (data-font-scale) scales every token uniformly. Values
      // are pixel-identical to the Stitch px scale at the default 18px base.
      fontSize: {
        "display-lg": ["2.6667rem", { lineHeight: "3.1111rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["1.7778rem", { lineHeight: "2.2222rem", fontWeight: "700" }],
        "headline-md": ["1.3333rem", { lineHeight: "1.7778rem", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.5556rem", fontWeight: "400" }],
        "body-md": ["0.8889rem", { lineHeight: "1.3333rem", fontWeight: "400" }],
        label: ["0.7778rem", { lineHeight: "1.1111rem", fontWeight: "600" }],
        "label-caps": ["0.6667rem", { lineHeight: "0.8889rem", letterSpacing: "0.05em", fontWeight: "600" }],
        button: ["0.8889rem", { lineHeight: "1.1111rem", fontWeight: "600" }],
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: {
        xs: "4px", base: "8px", sm: "12px", md: "24px", lg: "48px", xl: "80px",
        gutter: "24px", "margin-mobile": "16px", "margin-desktop": "64px",
      },
    },
  },
  plugins: [],
} satisfies Config;
