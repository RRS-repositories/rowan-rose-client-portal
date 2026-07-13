// Generates every raster app asset from the brand favicon.svg:
//   public/      — PWA + iOS home-screen icons (full-bleed navy square + "R")
//   resources/   — source art for @capacitor/assets (native Android/iOS icons
//                  and splash screens). Run `npx capacitor-assets generate`
//                  afterwards to fan these out into android/ and ios/.
//
// Why a script and not @vite-pwa/assets-generator: that tool bundles an old
// sharp (0.32.6) whose Windows binary fails to load here. We use the working
// top-level sharp directly, which also confirms @capacitor/assets (also sharp)
// will run.
//
// Re-run after replacing public/favicon.svg (e.g. a higher-res 1024² brand
// logo):  npm run cap:icons
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const res = join(root, "resources");
mkdirSync(res, { recursive: true });

const svg = readFileSync(join(pub, "favicon.svg"));
const NAVY = "#003c60";
const LIGHT_BG = "#f8f9fe";
const DARK_BG = "#111316";
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Just the light-blue "R" glyph from favicon.svg on a transparent canvas — used
// for the Android adaptive-icon foreground layer.
const rGlyphSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<path d="M32 14c7 0 12 4.6 12 11 0 4.7-2.9 8-7.1 9.4L45 50h-8.2l-7.3-14.2H28V50h-7V14h11zm-4 6.4v9.2h3.4c3.6 0 5.8-1.8 5.8-4.7s-2.1-4.5-5.7-4.5H28z" fill="#94ccff"/>` +
    `</svg>`,
);

const fullBleed = (size) =>
  sharp(svg, { density: 600 })
    .resize(size, size, { fit: "contain", background: NAVY })
    .flatten({ background: NAVY })
    .png();

// --- PWA / iOS home-screen icons (public/) ---
const pwa = [
  { name: "pwa-64x64.png", size: 64 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "maskable-icon-512x512.png", size: 512 },
  { name: "apple-touch-icon-180x180.png", size: 180 },
];
for (const { name, size } of pwa) {
  await fullBleed(size).toFile(join(pub, name));
  console.log("public/", name);
}

// --- Native source art (resources/) for @capacitor/assets ---

// Legacy / iOS icon: full-bleed navy + R.
await fullBleed(1024).toFile(join(res, "icon.png"));

// Android adaptive icon: solid navy background + R foreground sized to sit
// inside the adaptive safe zone (~55% so the launcher mask never clips it).
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
  .png()
  .toFile(join(res, "icon-background.png"));

const rGlyph = await sharp(rGlyphSvg, { density: 1200 })
  .resize(560, 560, { fit: "contain", background: TRANSPARENT })
  .png()
  .toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: TRANSPARENT } })
  .composite([{ input: rGlyph, gravity: "center" }])
  .png()
  .toFile(join(res, "icon-foreground.png"));
console.log("resources/ icon.png, icon-background.png, icon-foreground.png");

// Splash screens: the navy rounded-badge (favicon with its transparent corners
// preserved) centred on the app's light / dark background.
const badge = await sharp(svg, { density: 1200 })
  .resize(640, 640, { fit: "contain", background: TRANSPARENT })
  .png()
  .toBuffer();
for (const [name, bg] of [
  ["splash.png", LIGHT_BG],
  ["splash-dark.png", DARK_BG],
]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: bg } })
    .composite([{ input: badge, gravity: "center" }])
    .png()
    .toFile(join(res, name));
  console.log("resources/", name);
}
