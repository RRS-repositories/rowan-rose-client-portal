---
phase: "0.0"
area: frontend          # frontend | backend | security
title: "{{title}}"
status: planned         # planned | in-progress | blocked | done
depends_on: []          # e.g. ["1.3"]
created: {{date}}
updated: {{date}}
---

# Phase <number> — {{title}}

<context>
Where the project is when this phase starts, and what this phase assumes already exists.
Keep it short — link to the brief or earlier phases instead of repeating them.
</context>

## Goal

One or two sentences: what is true when this phase is done that wasn't before.

## Tasks

1. ...
2. ...

## Out of scope

What this phase deliberately does NOT do (prevents scope creep, tells the agent where to stop).

## Build notes — what actually happened

> Fill this in AS the phase is built, not after. This is the cross-session / cross-tool memory.
> Record decisions made, things that deviated from the plan, files added, gotchas. The next
> agent (Claude Code, Codex, whatever) reads this instead of re-deriving everything.

- (empty until work starts)

## Verification

How to confirm it works (commands, screens to check, a11y/contrast checks, etc.).
