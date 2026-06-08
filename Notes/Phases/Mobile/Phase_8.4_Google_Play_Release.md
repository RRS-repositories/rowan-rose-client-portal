---
phase: "8.4"
area: mobile
title: "Google Play release — signed AAB + store listing"
status: planned
depends_on: ["8.1", "7.1"]
created: 2026-06-05
updated: 2026-06-05
---

# Phase 8.4 — Google Play release

<context>
Android currently builds a **debug APK** (self-signed, sideload/dev only) from the Capacitor project
([[Phase_5.2_Mobile_App_Packaging]]). Publishing to Google Play needs a **signed release AAB**, a Play
Console account, a complete listing, and real client data (a store app with mock data isn't shippable
to clients). See [[00 - Mobile App Strategy]].
</context>

## Goal

The Rowan Rose app is **live on the Google Play Store**, installable by any client, running against the
real backend/CRM.

## Tasks

1. Create a **release keystore**; configure release signing in the Android project. **Guard the
   keystore** — losing it blocks all future updates.
2. Build a **signed AAB** (`gradlew bundleRelease`); set `versionCode`/`versionName`; target the
   current required SDK.
3. Google Play Console account (**$25 one-time**); create the app entry.
4. Store listing: icon, feature graphic, screenshots, short/long description; complete the **Data
   Safety** form; provide a **privacy policy** URL and an **account-deletion** path (we hold claim
   data — required).
5. Internal testing track → closed test → production rollout.

## Out of scope

App Store/iOS ([[Phase_8.5_Apple_App_Store_Release]]). Device features ([[Phase_8.1_Native_Device_Capabilities]])
and push ([[Phase_8.2_Push_Notifications]]) ship before/with this. Backend/CRM data is Phase 7.1.

## Build notes — what actually happened

- (empty until work starts)

## Verification

- Signed AAB uploads to Play Console without policy errors; app passes pre-launch report.
- Installable from an internal-testing link on a real device; runs against real data; push + camera +
  biometric work; accessibility floor holds.
- Data Safety + privacy policy + account deletion present and accurate.

> **Gate:** do not roll out to production until real backend/CRM data is wired (Phase 7.1) — clients
> must not receive an app full of mock data.
