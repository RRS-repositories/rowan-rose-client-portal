# Roadmap — All Phases

Status across every area. Scan this to know what's done, what's next, and what depends on what.
When a phase moves, update its row here AND the `status:` in the phase file's frontmatter.

Status legend: `done` · `in-progress` · `blocked` · `planned`

---

## Frontend

| Phase | Title | Status | Depends on | File |
|-------|-------|--------|-----------|------|
| 1.1 | Design system, theming, base components | done | — | _(built; spec not archived)_ |
| 1.2 | Layout shell + navigation | done | 1.1 | [[1.2 - Layout Shell and Navigation]] |
| 1.3 | Registration flow (auth) | done | 1.2 | [[1.3 - Registration Flow]] |
| 1.4 | Login, logout, password reset, session mgmt (auth) | done | 1.3 | [[1.4 - Login, Logout, Password Reset and Session]] |
| 1.5 | Dashboard with mock data | done | 1.4 | [[Phase_1.5_Dashboard_Page]] |
| 1.6 | Claim detail view | done | 1.5 | [[Phase_1.6_Claim_Detail_View]] |
| 2.1 | Documents page & upload | done | 1.6 | [[Phase_2.1_Documents_and_Upload]] |
| 3.1 | Messages / chat page | done | 2.1 | [[Phase_3.1_Messages_Page]] |
| 5.2 | Mobile app packaging (PWA + Capacitor Android) | done | 5.1 | [[Phase_5.2_Mobile_App_Packaging]] |
| 7.1 | Real API / CRM integration | planned | frontend signoff | _future_ |

> The build (`frontend/app/`, outside this vault) is ahead of the brief's "Phase A prototypes"
> stage — the "Modern Jurist" direction is chosen and production work is underway. Treat the
> numbered phases above as the live plan.

## Backend

Backend foundation is now in progress on Brad's explicit Phase 6.1 instruction. Feature endpoints remain deferred to Phase 7.1.

| Phase | Title | Status | Depends on | File |
|-------|-------|--------|-----------|------|
| 6.1 | Backend architecture, CRM integration foundation, auth, caching, backups, EC2 | in-progress | frontend signoff | [[Phase_6.1_Backend_Architecture_and_CRM_Integration]] |
| 7.1 | Real API / CRM integration endpoints | planned | 6.1 + CRM schema discovery | _future_ |

## Mobile (native app — Android + iOS)

The portal ships as a **downloadable native app** (Google Play + App Store) with push notifications —
not just a web/PWA. Strategy, goals and do/don't: [[00 - Mobile App Strategy]]. The foundation
(PWA + Capacitor Android) shipped as Frontend [[Phase_5.2_Mobile_App_Packaging]]. iOS builds via
**Codemagic** (cloud-Mac). Store releases (8.4 / 8.5) are gated on real data (Phase 7.1).

| Phase | Title | Status | Depends on | File |
|-------|-------|--------|-----------|------|
| 5.2 | Mobile app packaging (PWA + Capacitor Android) — foundation | done | 5.1 | [[Phase_5.2_Mobile_App_Packaging]] |
| 8.1 | Native device capabilities (camera capture + biometric unlock) | planned | 5.2 | [[Phase_8.1_Native_Device_Capabilities]] |
| 8.2 | Push notifications — real delivery (FCM + APNs) | planned | 8.1 + 6.1 | [[Phase_8.2_Push_Notifications]] |
| 8.3 | iOS native build & TestFlight (Codemagic cloud-Mac) | planned | 5.2 | [[Phase_8.3_iOS_Build_and_TestFlight]] |
| 8.4 | Google Play release (signed AAB + listing) | planned | 8.1 + 7.1 | [[Phase_8.4_Google_Play_Release]] |
| 8.5 | Apple App Store release (submission + review) | planned | 8.1, 8.3 + 7.1 | [[Phase_8.5_Apple_App_Store_Release]] |

## Security

Future area. No phases written yet. Likely: auth hardening, session management,
document-access controls, PII handling, dependency/secret scanning.

| Phase | Title | Status | Depends on | File |
|-------|-------|--------|-----------|------|
| — | _none yet_ | planned | — | — |

---

## How to add a phase

1. **New note from template:** create a note in `Phases/<Area>/` named `<number> - <Title>`
   (e.g. `1.4 - Login and Session`), then Command palette → *Insert template* → **Phase**.
   (The Templates plugin is set to the `Templates/` folder.)
2. Fill the frontmatter (`phase`, `area`, `title`, `status`, `depends_on`) and the spec.
3. Add a row to the correct table above.
4. While building, keep the **Build notes** section current. When done, flip `status:` to `done`
   here and in the file.
