---
phase: "8.1"
area: mobile
title: "Native device capabilities — camera capture + biometric unlock"
status: planned
depends_on: ["5.2"]
created: 2026-06-05
updated: 2026-06-05
---

# Phase 8.1 — Native device capabilities (camera capture + biometric unlock)

<context>
The app is a Capacitor 8 wrapper of the web build ([[Phase_5.2_Mobile_App_Packaging]]); Android is
scaffolded, iOS is not yet. No device-native plugins are installed (no camera, no biometric). The
document upload and auth flows are mock UI. This phase adds the first real native capabilities — the
ones that make it feel like a banking app and that justify the app to Apple (Guideline 4.2). See
[[00 - Mobile App Strategy]] for the overall thesis.
</context>

## Goal

Clients can **photograph** a document (ID, proof of address, bank statement) directly in the app, and
unlock the app with **Face ID / fingerprint**. Both are native-only enhancements; the web build is
unaffected and keeps its existing file-picker / password flow.

## Tasks

1. Add `@capacitor/camera`; wire a "Take a photo" option into the Documents upload flow (alongside
   the existing file picker), guarded by `Capacitor.isNativePlatform()`.
2. Request camera permission with a plain-English rationale; handle deny/limited gracefully.
3. Add biometric app-lock (e.g. a maintained Capacitor biometric plugin) + **secure token storage**
   (replace plain `localStorage`/`sessionStorage` for the session token on native).
4. Add an optional "Unlock with Face ID / fingerprint" preference in Profile (native only).
5. Keep everything mock-compatible — capture returns a local image that flows into the existing
   (mocked) upload UI until the real backend exists.

## Out of scope

Real upload to S3/CRM (that's the backend/Phase 7.1 work — capture still feeds the mock upload here).
Push notifications ([[Phase_8.2_Push_Notifications]]). iOS build itself ([[Phase_8.3_iOS_Build_and_TestFlight]]).

## Build notes — what actually happened

- (empty until work starts)

## Verification

- Native Android (and later iOS): Documents → "Take a photo" opens the camera, captured image appears
  in the upload UI; permission prompt shows the rationale and deny is handled.
- Biometric: enabling the preference locks the app; unlock works with fingerprint/Face ID; token is
  in secure storage (not readable as plain localStorage).
- Web build unchanged: no camera/biometric prompts; file picker + password flow intact.
