---
area: mobile
type: strategy
status: living
created: 2026-06-05
updated: 2026-06-05
---

# Mobile App Strategy & Roadmap

> Living document. This is the hub for the **native mobile application** track — the
> downloadable Rowan Rose app for **Android (Google Play)** and **iOS (App Store)**.
> Per-phase detail lives in the `Mobile/` phase notes; status lives in [[ROADMAP]].

## Why this exists (the thesis)

The portal is **not just a website** — it is a **full-fledged mobile app** that clients install
from the Play Store / App Store, the same way they install their banking app. The web build still
exists (desktop + anyone who prefers a browser), but the **app is the primary channel**.

Our clients are aged **18–90+**, mostly not tech-savvy, and live on their phones. They will **not**
remember a URL, open a browser, and navigate to a portal each month. They expect:

- an **icon on their home screen**,
- a **push notification** when something happens on their claim (offer arrived, document needed,
  status change, payment sent),
- **fingerprint / Face ID** unlock,
- the ability to **photograph a document** instead of finding a file.

That is the **banking-app model**, and it is the bar we are building to.

## Where we are today

| Capability | Status | Where |
|------------|--------|-------|
| Responsive web app | ✅ done | `frontend/app` (Phases 1.x–5.x) |
| Installable PWA (iPhone + Android "Add to Home Screen") | ✅ done | [[Phase_5.2_Mobile_App_Packaging]] |
| Native **Android** app (Capacitor, debug APK) | ✅ done | [[Phase_5.2_Mobile_App_Packaging]] · `frontend/app/MOBILE.md` |
| Native **iOS** app | ❌ not started | needs cloud-Mac (Codemagic) — [[Phase_8.3_iOS_Build_and_TestFlight]] |
| **Push notifications** (real delivery) | ❌ not started | [[Phase_8.2_Push_Notifications]] |
| Camera capture / biometric unlock | ❌ not started | [[Phase_8.1_Native_Device_Capabilities]] |
| On the Play Store / App Store | ❌ not started | [[Phase_8.4_Google_Play_Release]] · [[Phase_8.5_Apple_App_Store_Release]] |

**One codebase.** The app is the same React/Vite build wrapped by **Capacitor 8** — not a separate
native rewrite. appId `uk.co.rowanrose.portal`, app name **Rowan Rose**. Operational build/run
instructions: `frontend/app/MOBILE.md`.

## Goals

1. **Downloadable from both stores** — Google Play and Apple App Store, installable by any client.
2. **Push notifications for every claim event** — offer received, document required, status change,
   new message, payment processed. Tapping a notification deep-links to the relevant claim.
3. **Banking-grade trust** — biometric unlock, secure token/PII storage, TLS, account deletion.
4. **Capture, don't upload** — photograph ID / proof of address / bank statements with the camera.
5. **One codebase, web + app** — the web build and the native apps stay in lockstep; no fork.
6. **Accessible on real, old devices** — keep the §2 floor (≥17px mobile text, ≥44pt targets,
   WCAG AA/AAA, reduced-motion, 200% font scaling) on the phone, not just the web.

## Non-goals / out of scope (for now)

- A separate native (Swift/Kotlin/Flutter) rewrite — we wrap the web build with Capacitor.
- Custom push infrastructure — we use **FCM (Android) + APNs (iOS)** via `@capacitor/push-notifications`.
- Releasing to stores with **mock data** — store releases are gated on the real backend/CRM
  ([[Phase_6.1_Backend_Architecture_and_CRM_Integration]] → Phase 7.1).
- Shipping a "thin webview" with no native value (Apple **Guideline 4.2** rejection risk) — camera +
  push + biometric are what make it a real app, not just a wrapped site.

## Do / Don't (build principles for this track)

**DO**
- Keep **one Capacitor app** from the web build; ship web + app from the same `frontend/app`.
- Keep the **`CAP_BUILD` service-worker gate** — native builds ship no SW (see [[Phase_5.2_Mobile_App_Packaging]]).
- Deliver push via **FCM + APNs** through `@capacitor/push-notifications`; **deep-link** each
  notification to its claim; honour the existing in-app notification preferences (Phase 5.1).
- Add **biometric unlock** + **secure storage** for the session token (not plain `localStorage`).
- Use the **camera** for document capture; request permissions with plain-English rationale.
- Build/sign **iOS on Codemagic** (cloud-Mac) — we develop on Windows.
- Test on **real low-end Android + an older iPhone**; verify large fonts, reduced motion, 44pt targets.
- Guard signing keys (Android keystore, Apple certs) — losing them blocks future updates.

**DON'T**
- Don't re-enable the **page-transition animation on native** — it deadlocked the Android WebView and
  blanked the screen; native uses instant routing (see [[Phase_5.2_Mobile_App_Packaging]] build notes).
- Don't store **JWT / PII** in plain `localStorage`/`sessionStorage` on device — use secure storage.
- Don't submit to **Apple** without real native capability (4.2) or with mock-only data.
- Don't **fork** the codebase into a separate native project.
- Don't break the **accessibility floor** for the sake of "app polish."
- Don't ship `server.url` / live-reload config in a **release** build (dev-only).

## Push notification architecture (target)

- **Client:** `@capacitor/push-notifications` registers the device, gets a token, handles taps →
  routes to the claim. Permission prompt on first relevant event, not at cold start.
- **Android:** Firebase Cloud Messaging (FCM) — `google-services.json` in the Android project.
- **iOS:** Apple Push Notification service (APNs) via an Apple push key, bridged through FCM so the
  backend has **one** send path. (FCM is already the planned service — see `backend/CLAUDE.md`.)
- **Backend:** store device tokens against the contact, send on claim events (offer, document
  request, status change, message, payment), and respect the client's notification preferences.
  Real-time in-app updates use **Socket.io** (also per `backend/CLAUDE.md`).
- **Depends on the backend** ([[Phase_6.1_Backend_Architecture_and_CRM_Integration]] / Phase 7.1) —
  push can't be real until the backend can send it.

## Store distribution — what each store needs

**Google Play** (doable from Windows)
- Play Console developer account — **$25 one-time**.
- A **signed AAB** (release keystore — guard it), `versionCode`/`versionName`, target SDK current.
- Store listing (icon, feature graphic, screenshots, description), **Data Safety** form, **privacy
  policy** URL, and an **account-deletion** path (we hold claim data → required).

**Apple App Store** (needs macOS at build/submit time → **Codemagic**)
- Apple Developer Program — **$99/year**.
- Built/signed via Codemagic; uploaded to **App Store Connect**; passes Apple **review** (days).
- App Privacy details; **Guideline 4.2** mitigated by camera + push + biometric.
- **TestFlight** for internal/beta testing before public release.

## Security & privacy (banking-grade — we hold PII for a UK law firm)

- Biometric (Face ID / fingerprint) app-lock; secure token storage; auto-logout.
- TLS only; no sensitive data in logs; certificate handling per platform defaults.
- GDPR: data export (SAR) + account deletion surfaced in-app (UI exists in Profile, Phase 5.1).
- Least-privilege native permissions (camera + notifications only; request with rationale).

## iOS path (decided)

Build and sign iOS on **Codemagic** (hosted macOS CI) — no Mac purchase needed since development is
on Windows. Alternative (physical Mac + Xcode) remains possible but is not the planned path.

## Roadmap (Mobile area)

See [[ROADMAP]] for live status. Summary:

| Phase | Title | Depends on |
|-------|-------|-----------|
| [[Phase_5.2_Mobile_App_Packaging]] | PWA + Capacitor Android (foundation) | — (done) |
| [[Phase_8.1_Native_Device_Capabilities]] | Camera capture + biometric unlock | 5.2 |
| [[Phase_8.2_Push_Notifications]] | Real push (FCM + APNs) for claim events | 8.1 + backend |
| [[Phase_8.3_iOS_Build_and_TestFlight]] | iOS build/sign via Codemagic + TestFlight | 5.2 |
| [[Phase_8.4_Google_Play_Release]] | Signed AAB + Play Store listing | 8.1 + real data |
| [[Phase_8.5_Apple_App_Store_Release]] | App Store submission + review | 8.1, 8.3 + real data |

> **Sequencing note:** store releases (8.4 / 8.5) need **real client data**, so they come after the
> backend/CRM integration (Phase 7.1). Device features (8.1) and the iOS build (8.3) can start
> earlier, against mocks, in parallel with backend work.
