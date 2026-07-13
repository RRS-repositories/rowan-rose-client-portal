// Serves the debug APK over the LAN so a phone on the same Wi-Fi can download
// and install it (no USB cable needed). Run:  node scripts/serve-apk.mjs
// Then on the phone open  http://<this-PC-LAN-IP>:8000/  and tap the download.
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apk = join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const PORT = 8000;

let size;
try {
  size = statSync(apk).size;
} catch {
  console.error("APK not found — build it first:\n  npm run mobile:build && npx cap sync android\n  (cd android && ./gradlew assembleDebug)");
  process.exit(1);
}

createServer((req, res) => {
  if (req.url === "/" || req.url?.startsWith("/rowan-rose.apk")) {
    res.writeHead(200, {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="rowan-rose.apk"',
      "Content-Length": size,
    });
    createReadStream(apk).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Open / to download rowan-rose.apk");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Serving rowan-rose.apk (${(size / 1024 / 1024).toFixed(1)} MB) on port ${PORT}`);
  console.log(`On your phone (same Wi-Fi) open:  http://<this-PC-LAN-IP>:${PORT}/`);
});
