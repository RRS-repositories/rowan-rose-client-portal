# 📂 Project Index — Rowan Rose Client Portal

The home page of this vault. **Start here** — any tool, any session.

> **Bootstrap (so you never re-explain the project):** point the agent at this note, then
> [[ROADMAP]], then the area's `CLAUDE.md`. Claude Code, Codex, Cursor — same chain.
> The agent reads the whole repo, so it sees these files even though the vault is only `Notes/`.

---

## Status

- 🟢 **Frontend — production build** active in `frontend/app/` — phases 1.x–5.x landed
- 🟢 **Design direction** chosen: "Modern Jurist" (see `frontend/design-source/DESIGN.md`)
- 🟢 **Mobile — native app** shipped as PWA + Capacitor **Android**; **iOS, push & app stores planned** → [[00 - Mobile App Strategy]]
- 🟡 **Backend** — foundation in progress (Phase 6.1)
- ⚪ **Security** — future area, no phases written yet

Full per-phase detail: [[ROADMAP]].

> The portal is **not just a web app** — it ships as a **downloadable native app** (Google Play +
> App Store) with push notifications, like a banking app. See [[00 - Mobile App Strategy]].

---

## Phases (this vault)

- [[ROADMAP]] — every phase, every area, with status + dependencies
- `Phases/Mobile/` — [[00 - Mobile App Strategy]] (native app: iOS, push, app stores) + phases 8.1–8.5
- `Phases/Frontend/` — [[1.2 - Layout Shell and Navigation]] · [[1.3 - Registration Flow]] · [[Phase_5.2_Mobile_App_Packaging]]
- `Phases/Backend/` — [[Phase_6.1_Backend_Architecture_and_CRM_Integration]] · `Phases/Security/` — empty until that area starts
- **Add a phase:** new note in `Phases/<Area>/` → Command palette → *Insert template* → **Phase**.
  Then add a row to [[ROADMAP]]. Fill its "Build notes" as you build; flip `status:` when done.

---

## Quick Links (vault notes)

- [[01 - Decisions]] — running log of decisions made
- [[02 - Open Questions]] — things still to resolve
- [[03 - Phase A Review Notes]] — prototype review notes
- [[04 - Stack Decision Worksheet]] — Phase B stack pick
- [[05 - Brand Assets Checklist]] — what's needed visually

---

## Key Project Files (in the repo, outside this vault — open in your editor)

These are read by agents but live next to the code, so they aren't clickable in Obsidian:

- `CLAUDE.md` (root) — project-wide rules for any agent
- `AGENTS.md` (root) — entry point for non-Claude tools (points back here)
- `frontend/CLAUDE.md` — frontend workflow + the Phase A/B gate
- `frontend/Client_Portal_Frontend_Brief.md` — source of truth for the frontend
- `frontend/design-source/DESIGN.md` — the chosen visual direction
- `backend/CLAUDE.md` — locked until frontend signoff

| Folder | Purpose | Status |
|--------|---------|--------|
| `frontend/` | Active build area | 🟢 building |
| `backend/` | API + integration | ⚪ locked |
| `Notes/` | This vault — notes + phase tracking | — |

---

## Reference

- Firm: Rowan Rose Solicitors trading as Fast Action Claims
- SRA 8000843 · Company No. 12916452
- City Point, 701 Chester Road, Stretford, Manchester, M32 0RW
