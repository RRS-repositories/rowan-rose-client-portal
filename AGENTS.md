# AGENTS.md

Entry point for any coding agent (Codex, Cursor, Claude Code, etc.) working in this repo.

**Before doing anything, read in this order:**

1. [`Notes/00 - Project Index.md`](Notes/00%20-%20Project%20Index.md) — project hub: status, map, bootstrap (start here)
2. [`Notes/Phases/ROADMAP.md`](Notes/Phases/ROADMAP.md) — every phase and its status
3. [`CLAUDE.md`](CLAUDE.md) — project-wide rules, firm context, audience, scope guardrails
4. The `CLAUDE.md` in the area you're working in (`frontend/`, `backend/`)

`Notes/` is an Obsidian vault. It holds Brad's personal notes **and** the phase tracking in
`Notes/Phases/`. You may read all of it. You may **write** to `Notes/Phases/` (phase specs,
Build notes, `status:`) and `Notes/Phases/ROADMAP.md`. Do **not** edit Brad's other notes
(`00`–`05`, `Daily/`, etc.) unless he asks.

The `CLAUDE.md` files are plain markdown — they apply to you regardless of tool. Follow their
rules (frontend-first sequencing, the Phase A/B gate, the out-of-scope list).

When a phase is built, update its file in `Notes/Phases/<Area>/` (Build notes + `status:`) and
the row in `Notes/Phases/ROADMAP.md`. That record is the shared memory across sessions and tools.
