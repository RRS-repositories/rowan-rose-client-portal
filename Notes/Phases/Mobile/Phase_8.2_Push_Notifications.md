---
phase: "8.2"
area: mobile
title: "Push notifications — real delivery for claim events (FCM + APNs)"
status: planned
depends_on: ["8.1", "6.1"]
created: 2026-06-05
updated: 2026-06-05
---

# Phase 8.2 — Push notifications (real delivery for claim events)

<context>
The in-app notification UI is complete but fully mocked: `NotificationContext`, `NotificationsMenu`
(bell + feed), and the Profile notification preference toggles (Phase 5.1) all derive from mock data
with no real delivery. The backend already names **Firebase Cloud Messaging + Socket.io** as the
planned push/real-time stack (`backend/CLAUDE.md`). This phase makes notifications real — the single
biggest reason clients need the app over the website. See [[00 - Mobile App Strategy]].
</context>

## Goal

A client gets a **push notification on their phone** when something happens on their claim — offer
received, document required, status change, new message, payment processed — and **tapping it opens
that claim** in the app. Delivery respects the client's existing notification preferences.

## Tasks

1. Add `@capacitor/push-notifications`; register the device on login, obtain the token, and send it to
   the backend against the contact. Request permission at a meaningful moment (not cold start).
2. **Android:** Firebase Cloud Messaging — add `google-services.json` to the Android project.
3. **iOS:** APNs via an Apple push key, bridged through FCM so the backend has one send path
   (coordinate with [[Phase_8.3_iOS_Build_and_TestFlight]]).
4. Handle foreground + background + tapped notifications; **deep-link** the tap to the relevant claim
   route; update the in-app bell/badge from the live feed (replace mock `NotificationContext`).
5. **Backend:** token storage + a send-on-event path for the five claim events, gated by the client's
   notification preferences. (Backend work — Phase 6.1/7.1.)

## Out of scope

The notification UI itself (already built, Phase 5.1). Email/SMS channels (Office 365 / Twilio —
backend's domain). Marketing pushes.

## Build notes — what actually happened

- (empty until work starts)

## Verification

- Trigger each claim event (offer / document / status / message / payment) → device receives a push;
  tapping opens the correct claim.
- Toggling a preference off in Profile suppresses that push type.
- Foreground/background/cold-tap all handled; in-app bell badge matches the real feed.
- Web build unaffected (no native push; in-app feed still works once wired to the real backend).
