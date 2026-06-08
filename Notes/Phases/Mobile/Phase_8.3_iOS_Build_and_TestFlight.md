---
phase: "8.3"
area: mobile
title: "iOS native build & TestFlight via Codemagic (cloud-Mac)"
status: planned
depends_on: ["5.2"]
created: 2026-06-05
updated: 2026-06-05
---

# Phase 8.3 — iOS native build & TestFlight (cloud-Mac)

<context>
Android is scaffolded and builds locally; **iOS is not** — there is no `frontend/app/ios/` and the dev
machine is Windows, which **cannot build iOS** (no Xcode/codesigning). Capacitor already abstracts the
app, so the same web build can target iOS; only the build/sign step needs macOS. Decision (see
[[00 - Mobile App Strategy]]): use **Codemagic** (hosted macOS CI), not a physical Mac.
</context>

## Goal

The iOS app is **built, signed, and installable via TestFlight** from a cloud-Mac pipeline — no Mac
purchase — so the iPhone app can be tested on real devices ahead of an App Store release.

## Tasks

1. `npx cap add ios` (scaffold `ios/`) — can be generated for commit even from Windows; only the
   build needs macOS.
2. Apple Developer Program enrolment ($99/yr); create the App ID (`uk.co.rowanrose.portal`), signing
   certificate and provisioning profile.
3. Set up a **Codemagic** workflow: checkout → `npm ci` → `npm run mobile:build` → `npx cap sync ios`
   → archive/sign → upload to **TestFlight**.
4. Apply the same native config as Android (splash, status bar, safe-area insets, instant routing) and
   confirm the iOS status-bar/notch handling.
5. Internal TestFlight test on a real iPhone.

## Out of scope

Public App Store submission/review ([[Phase_8.5_Apple_App_Store_Release]]). Push certs are coordinated
with [[Phase_8.2_Push_Notifications]]. Android release ([[Phase_8.4_Google_Play_Release]]).

## Build notes — what actually happened

- (empty until work starts)

## Verification

- Codemagic build succeeds and uploads to App Store Connect / TestFlight.
- App installs from TestFlight on a real iPhone, launches standalone, navigates all tabs, theme +
  toast behave (parity with Android), no blank screens.
- `ios/` committed; signing assets stored securely (not in the repo).
