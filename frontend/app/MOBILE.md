# Running the portal as a mobile app (iPhone + Android)

The portal is one responsive web app (`frontend/app`) that can run on a phone three ways. All of
it works on **mocks** — no backend needed. Test login: `client@test.com` / `Password1`.

| Path | iPhone | Android | App store | Needs |
|------|:---:|:---:|:---:|------|
| **PWA** (Add to Home Screen) | ✅ now | ✅ now | ❌ | nothing (works today) |
| **Native Android** (Capacitor APK) | — | ✅ now | later | Android Studio + JDK 21 |
| **Native iOS** (Capacitor) | later | — | later | a Mac (can't build on Windows) |

---

## 1. PWA — install on either phone today (fastest)

This installs the app to the home screen: full-screen, app icon, no browser bar — visually identical
to the web app. It's the only way to get it on the **iPhone** from a Windows machine.

**On the PC** (from `frontend/app`):
```powershell
npm run build
npx vite preview --host --port 4173
```
Use `preview`, not `dev` — the PWA service worker only runs in a real build.

- Phone and PC must be on the **same Wi-Fi / network**.
- The PC's LAN address is currently **`192.168.1.2`** (re-check with `ipconfig` → IPv4 of the active
  adapter; ignore VMware `192.168.x.1` and any VPN `10.x` addresses).
- First run, Windows Firewall prompts — **allow Node on Private networks**. (A running VPN can block
  LAN traffic; turn it off for the test if the phone can't reach the PC.)
- On the phone, open: **`http://192.168.1.2:4173`**

**Install it:**
- **iPhone (Safari only):** Share → **Add to Home Screen** → Add.
- **Android (Chrome):** menu (⋮) → **Install app** / **Add to Home screen**.

Launch from the new home-screen icon — it opens standalone.

> PWA limits (this is for testing/exploration, not distribution): not in the App/Play stores; iOS
> install must be via Safari; cached storage can be evicted by the OS.

---

## 2. Native Android app (real installable APK)

Capacitor wraps the same build into a native Android project (`frontend/app/android/`, already
scaffolded). The native build ships **no service worker** (avoids stale-cache white screens) — that's
handled automatically by the `mobile:build` script.

### Toolchain (already installed on this machine — no admin used)
Set up under your user folder; persisted as user env vars (`JAVA_HOME`, `ANDROID_HOME`,
`ANDROID_SDK_ROOT`). The system default `java` is untouched (still 8); Gradle uses `JAVA_HOME`.
- **JDK 21** → `%LOCALAPPDATA%\Android\jdk21\jdk-21.0.11+10`
- **Android SDK** (cmdline-tools, platform-tools, `platforms;android-36`, `build-tools;36.0.0`)
  → `%LOCALAPPDATA%\Android\Sdk`  (also recorded in `android/local.properties`, gitignored)

> To reinstall on a fresh machine: install a JDK 21 + the Android SDK (Android Studio is the easy
> route), set `JAVA_HOME`/`ANDROID_HOME`, install SDK 36 + build-tools 36.

### Build the debug APK
```powershell
npm run mobile:build              # SW-free web bundle
npx cap sync android              # copy it into android/
cd android; .\gradlew.bat assembleDebug; cd ..
```
Output: `frontend\app\android\app\build\outputs\apk\debug\app-debug.apk` (self-signed debug build,
installs without Play).

### Get it onto the phone (no USB needed)
```powershell
node scripts/serve-apk.mjs        # serves the APK on http://<this-PC-LAN-IP>:8000/
```
On the phone (same Wi-Fi) open `http://192.168.1.2:8000/`, download `rowan-rose.apk`, tap it, and
allow "install unknown apps" for your browser when prompted.

### Run on a USB-connected phone / emulator (optional)
Enable **Developer options → USB debugging** on the phone, connect USB, then:
```powershell
npm run cap:android               # builds, installs and launches on the device
```
### Live-reload (no more reinstalling for each change)
Build a one-off "dev" APK that loads from the running Vite dev server, so code changes hot-reload on
the device. `capacitor.config.ts` reads `CAP_SERVER_URL` (env-gated — never committed into a build):
```powershell
# 1. start the dev server on the LAN (leave running)
npm run dev -- --host --port 5173
# 2. build a live APK pointed at this PC, in a second terminal:
$env:CAP_SERVER_URL = "http://192.168.1.2:5173"   # use your ipconfig IPv4
npx cap sync android
cd android; .\gradlew.bat assembleDebug; cd ..
node scripts/serve-apk.mjs                          # install it on the phone once
```
Install that APK once. From then on: keep the dev server running, edit code, the phone reloads — no
rebuild/reinstall. Caveats: the dev server must be running and the phone on the same Wi-Fi; the PC's
IP is baked into that APK (rebuild if it changes). To return to a normal bundled build, run
`npx cap sync android` again **without** `CAP_SERVER_URL` set, then rebuild.

---

## 2b. Share with someone remote (different network / their iPhone)

LAN URLs can't reach someone elsewhere, and an iPhone can't install an APK. Expose the **built PWA**
over a temporary public HTTPS link with a Cloudflare quick tunnel (no account), then they install it
in Safari → Share → **Add to Home Screen**:
```powershell
npm run build                                       # PWA build (service worker + manifest)
npx -y serve -s dist -l 4173                         # static server (no Host allowlist) — leave running
# in another terminal (cloudflared.exe is in %LOCALAPPDATA%\cloudflared):
cloudflared tunnel --url http://localhost:4173 --no-autoupdate
```
It prints a `https://<random>.trycloudflare.com` URL — send that. Notes: the link lives only while
your PC + tunnel run and changes every restart; serve the **built** app via `serve` (not `vite
preview`, whose `allowedHosts` check 403s tunnels; not the dev server, which has no service worker).
For a permanent link, deploy `dist/` to a static host (Netlify/Vercel/Cloudflare Pages) instead.

---

## 3. Native iOS app — later

iOS **cannot be built on Windows** (no Xcode/codesigning). For now, use the **PWA** (section 1) on
iPhone. When App Store distribution is wanted:
- on a **Mac**: `npx cap add ios` → `npx cap open ios` → build in Xcode, **or**
- a **cloud-Mac CI** (Codemagic / Ionic Appflow) builds iOS from the repo without a physical Mac.

Apple Developer Program is **$99/yr**; Apple may reject a thin webview (Guideline 4.2) unless it uses
native capability — that's when we'd add `@capacitor/camera` (photograph documents) and push.

---

## Regenerating app icons

All icons derive from `public/favicon.svg`. If that's replaced (ideally with a 1024² brand logo):
```powershell
npm run cap:icons              # regenerates public/ PWA icons + resources/ native source art
npx capacitor-assets generate --android   # fans native art into android/
npx cap sync android
```

## How it fits together
- `npm run build` → **web build, PWA on** (service worker + manifest). Unchanged from before.
- `npm run mobile:build` → sets `CAP_BUILD=1` → **same app, no service worker** (for native).
- Everything runs on mocks (`VITE_USE_MOCKS=true`); no backend involved.
