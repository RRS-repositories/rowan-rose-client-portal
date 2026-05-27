# 📋 Decisions Log

Running log of decisions made on this project. Format: date · decision · rationale.

---

## 2026-05-25 — Project Kickoff

- **Frontend-first workflow.** UI built and approved before any backend work begins. UI direction is historically the bottleneck — locking it down first stops downstream rework.
- **Two-phase frontend.** Phase A = framework-agnostic HTML/CSS prototypes (4–5 distinct directions). Phase B = production build in chosen stack. Hard gate between phases — Claude Code stops and waits for approval.
- **Reject "same common stack."** No NativeWind + shadcn + Framer Motion default. Aesthetic directions during Phase A explicitly steer away from generic AI-template look.
- **Audience constraint locked.** 18–90+ year olds. Accessibility floor (text size, tap target, contrast, reduced motion, font scaling) is non-negotiable.
- **Stack candidates for Phase B:** Expo + Tamagui (default), Flutter, Kotlin Multiplatform + Compose Multiplatform. Decision deferred to start of Phase B.

---

## (Add new decisions below as they're made)

### YYYY-MM-DD — [decision]

- **What:**
- **Why:**
- **Implications:**
