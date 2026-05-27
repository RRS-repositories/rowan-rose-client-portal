# Rowan Rose Client Portal

Cross-platform (iOS + Android + web) client portal for Rowan Rose Solicitors (Fast Action Claims). Lets clients track irresponsible-lending claims, upload documents, accept settlement offers, and receive updates.

---

## Structure

```
RowanRose_ClientPortal/
├── CLAUDE.md          # Project-wide instructions for Claude Code (read first)
├── README.md          # This file
├── .gitignore
├── .obsidian/         # Obsidian vault config
├── Notes/             # Obsidian vault — decisions, open questions, review notes
├── frontend/          # ACTIVE WORK AREA
│   ├── CLAUDE.md
│   ├── Client_Portal_Frontend_Brief.md
│   ├── prototypes/    # Phase A output
│   └── app/           # Phase B output
└── backend/           # NOT STARTED — see backend/CLAUDE.md
```

---

## Starting Claude Code

From the project root:

```bash
# One-time: install recommended MCPs
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
claude mcp add magic npx @21st-dev/magic@latest

# Start Claude Code
claude
```

First prompt to give Claude Code:

> Read CLAUDE.md and frontend/CLAUDE.md, then read frontend/Client_Portal_Frontend_Brief.md. When you're ready, begin Phase A.

After Phase A delivery, review prototypes in your browser, log thoughts in `Notes/03 - Phase A Review Notes.md`, then give Claude Code one of:

> Approved — go with direction 03 (Warm Humanist). Begin Phase B with Expo + Tamagui.

or

> Approved — direction 02 layout with the palette of direction 04. Begin Phase B with Expo + Tamagui.

---

## Obsidian Vault

This folder doubles as an Obsidian vault. Open in Obsidian:
**File → Open vault → Open folder as vault** → select this folder.

Config is in `.obsidian/`. Notes are in `Notes/`. Start at `Notes/00 - Project Index.md`.

---

## Phase Status

- 🟡 **Phase A** — Frontend design exploration (active)
- ⚪ **Phase B** — Frontend production build (waiting on Phase A approval)
- ⚪ **Backend build** (waiting on frontend signoff)

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` (root) | Project-wide rules for Claude Code |
| `frontend/CLAUDE.md` | Frontend workflow + gates |
| `frontend/Client_Portal_Frontend_Brief.md` | The detailed brief — source of truth |
| `backend/CLAUDE.md` | DO NOT START warning + context for later |
| `Notes/00 - Project Index.md` | Vault entry point |
| `Notes/01 - Decisions.md` | Running decisions log |
| `Notes/04 - Stack Decision Worksheet.md` | Phase B stack pick |
