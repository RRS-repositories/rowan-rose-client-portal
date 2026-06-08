---
phase: "8.5"
area: mobile
title: "Apple App Store release — submission + review"
status: planned
depends_on: ["8.1", "8.3", "7.1"]
created: 2026-06-05
updated: 2026-06-05
---

# Phase 8.5 — Apple App Store release

<context>
Builds on the iOS pipeline ([[Phase_8.3_iOS_Build_and_TestFlight]], which gets the app onto TestFlight
via Codemagic) and the native capabilities ([[Phase_8.1_Native_Device_Capabilities]],
[[Phase_8.2_Push_Notifications]]) that make it a real app rather than a wrapped website. Apple review is
stricter than Google's — a thin webview risks **Guideline 4.2** rejection. See [[00 - Mobile App Strategy]].
</context>

## Goal

The Rowan Rose app is **live on the Apple App Store**, installable by any iPhone client, running
against the real backend/CRM.

## Tasks

1. Promote the Codemagic-built, signed iOS app from TestFlight to an **App Store Connect** submission.
2. Complete **App Privacy** details; confirm camera + push + biometric are present so the app clears
   **Guideline 4.2** (minimum functionality).
3. Store listing: screenshots (required device sizes), description, keywords, support + privacy URLs,
   age rating, account-deletion path.
4. Submit for **review**; respond to any reviewer notes (document the native features in review notes).
5. Release to production.

## Out of scope

Google Play ([[Phase_8.4_Google_Play_Release]]). The iOS build pipeline itself (8.3). Backend/CRM
data is Phase 7.1.

## Build notes — what actually happened

- (empty until work starts)

## Verification

- App passes Apple review and is downloadable from the App Store on a real iPhone.
- Runs against real data; push + camera + biometric functional; accessibility floor holds.
- App Privacy, account deletion, and support/privacy URLs accurate.

> **Gate:** do not submit for public release until real backend/CRM data is wired (Phase 7.1) and the
> native features (8.1/8.2) are in, or Apple may reject as a thin webview / incomplete app.
