---
phase: "7.4"
area: backend
title: "Hermes chat — CRM↔portal live chat with AI agent (Phase 1 core)"
status: in-progress
depends_on: ["7.2"]
created: 2026-08-06
updated: 2026-08-06
---

# Phase 7.4 — Hermes chat (Phase 1 core)

<context>
Brad's spec set lives in `Notes/Chat/`: HERMES-CHAT-SPEC.md (behaviour,
authoritative), CHAT_ARCHITECTURE.md (runtime), CHAT_SCHEMA.md (data model,
supersedes spec §3), hermes-chat-mockup.html (approved visuals). Client-facing
persona is **Sarah**; all code identifiers keep **Hermes**. This phase builds
spec Phase 1 (core): per-claim chat, Sarah answers from live CRM data via the
Anthropic API, hard guardrails, human handoff via Mattermost. Spec Phase 2
(streaming/attachments/polish) and Phase 3 (CRM Hub) come later.
</context>

## Goal

A real client message in the portal chat receives a real Claude-generated,
CRM-grounded Sarah reply over the socket with no human involvement; anything
out of bounds hands off to the CS team — with every exchange audited.

## Key adaptations (specs' placeholders → this codebase)

- `claims` → `public.cases`; ids are INTEGER (spec Q5 answered).
- Chat tables live in the **portal schema** owned by `portal_app` (notifications
  precedent) — no cross-schema FKs to contacts/cases; ownership by contactId
  scoping. Migration `backend/sql/chat.sql`, gated like all DDL.
- Stage labels = existing `statusMap.js`; context from existing `repo.js`
  mappers with `financials` stripped (no settlement figures in context, ever).
- Socket auth reuses the portal JWT verify + contact resolution (refactored out
  of `middleware/auth.js`).
- nginx (not ALB) fronts the backend — WebSocket upgrade + ≥120s read timeout
  on the socket path is a deploy step (sudo).
- PM2 already fork/1-instance; §2 boot guard added regardless.
- New deps only: socket.io, socket.io-client, @anthropic-ai/sdk.

## Decisions

- **OTP login (Brad, 2026-08-06): PARKED — not in scope now.** Chat is built and
  tested on the test account with the existing email+DOB login. Brad's earlier
  position was that OTP (CHAT_SCHEMA Appendix A) lands before chat opens to real
  clients; that remains the standing recommendation from CHAT_ARCHITECTURE §11
  (transcripts become the most sensitive data behind portal login), so re-raise
  it when client rollout is discussed — do NOT treat it as a blocker for the
  build or for test-account verification.
- Call-us hours label defaults to Mon–Fri 9am–5pm until Brad corrects.
- Retention + comms-tab UNION vs sub-tab: parked to Phase 3.

## Out of scope

Streaming, attachment uploads, CRM Customer Service Hub UI (the
`v_chat_communications` view ships now as its data contract), OTP itself,
push delivery for backgrounded apps.

## Build notes — what actually happened

**Phase 1 APPLIED + DEPLOYED 2026-08-06 (Brad approved). ⚠️ `ANTHROPIC_API_KEY`
still not set on the portal EC2 — until Brad adds it, every client message
fails safe to a human handoff (by design) rather than getting a Sarah reply.
That key is the last step before the Phase 1 exit test.**

Live and verified on production:
- Migration applied as `portal_app`: 4 `portal.chat_*` tables (all owned by
  portal_app), `trg_chat_touch`, `portal.v_chat_communications` (view returns rows).
- nginx: WebSocket upgrade + `$connection_upgrade` map (`/etc/nginx/conf.d/websocket.conf`)
  + 120s read/send timeouts on `/portal-api/`. **Gotcha:** the first backup was written
  to `sites-enabled/default.bak-*`, which nginx loads → "duplicate default server"
  and a failed `nginx -t`. Backups now live in `/etc/nginx/backups/` — never leave
  one in sites-enabled.
- Backend restarted: log shows `✔ chat socket layer attached`; health up.
  Non-secret env defaults added (`HERMES_MODEL`, `HERMES_MAX_TOKENS`,
  `CHAT_RATE_LIMIT_PER_MIN`, `PORTAL_PUBLIC_URL`).
- Socket.io handshake proxies correctly through nginx (200, `upgrades:["websocket"]`).
- `GET /api/chat/conversations` returns `{conversations:[],unread:0}` for the test login.
- **Ownership test passed on the live backend**: stray conversation id → FORBIDDEN;
  invalid token rejected at the handshake. (Cross-account probe needs a second test
  login — set `CHAT_TEST_EMAIL_B`.)
- Greeting persisted correctly on first open: conversation 1 (contact 234852, status
  `bot`), one `hermes` message — "Hi Ayush — I'm Sarah, the assistant for Fast Action
  Claims…". Nothing client-side says "Hermes".

- **Schema** (`backend/sql/chat.sql`, run once as `portal_app`): `portal.chat_conversations`
  / `chat_messages` / `chat_agent_runs` / `chat_attachments` + `chat_touch_conversation`
  trigger + `portal.v_chat_communications` view (Phase 3's data contract, shipped now).
  INT ids (contacts/cases are INTEGER), no cross-schema FKs — ownership is enforced by
  contactId scoping, as with `portal.notifications`.
- **Backend** `backend/src/chat/`: `index.js` (Socket.io on the existing HTTP server +
  single-instance boot guard), `socketAuth.js` (JWT → `socket.data.contactId` via a new
  shared `resolveSession()` refactored out of `middleware/auth.js` — one auth path for
  REST and socket), `handlers.js` (open/sync/send/typing/read/handoff; rooms joined only
  after an ownership check; ack emitted BEFORE the agent runs), `db.js` (find-or-create
  upsert + idempotent insert per CHAT_SCHEMA), `recovery.js` (boot + 60s orphan sweep),
  `routes.js` (`/api/chat/conversations`, `/…/messages`), `mattermost.js` (name + ref +
  reason only; failure never blocks the handoff).
- **Hermes** `backend/src/chat/hermes/`: `agent.js` (run row → typing → preCheck →
  context → Claude → postCheck → persist; 8-call semaphore; `status!=='bot'` guard at the
  top; every failure path ends in a handoff), `contextBuilder.js` (fresh per message,
  **financials stripped**, card pre-built here), `prompt.js` (Sarah persona, copy-only
  file), `guardrails.js` (pre: settlement/legal/complaint/vulnerability/abuse; post:
  strip `<<HANDOFF>>`, block £ figures not in context, block internal codes),
  `claude.js` (`@anthropic-ai/sdk`, 30s timeout, one jittered retry on 429/5xx).
- **Frontend** `frontend/app/src/features/chat/`: `useChatSocket.ts` (optimistic send
  keyed by clientMsgUuid → `message:ack`; reconnect → `conversation:sync`; offline banner
  off socket state), `HermesChat.tsx` (claim picker, thread, pre-built card renderer,
  typing indicator, talk-to-a-person dropdown, composer + AI disclaimer), `chatTypes.ts`
  (`ASSISTANT_DISPLAY_NAME`, error copy, contact config). `routes/Chat.tsx` renders
  HermesChat on REAL_AUTH and keeps the mock thread UI for mock mode; the nav badge takes
  chat unread from the conversations endpoint on real auth.
- **Verified pre-deploy:** backend + test syntax clean, frontend build clean, and the
  spec §10 grep — **"Hermes" is absent from the built bundle** (Sarah present).
- **Ownership test** `backend/test/chat-ownership.test.mjs`: asserts a stray id →
  FORBIDDEN, B cannot read or write A's conversation, and a bad token is rejected at the
  handshake. Runs against a live backend with two real logins.
- Deps added: `socket.io`, `@anthropic-ai/sdk` (backend), `socket.io-client` (frontend +
  backend dev, for the test).

## Verification

Spec §10 Phase-1 subset on the live portal test account: greeting + claim
picker; status question → grounded Sarah reply + pre-built card (exit test);
settlement question → refusal + handoff + Mattermost < 2s + Sarah silent after;
talk-to-a-person dropdown paths; cross-contact FORBIDDEN probe; kill-process
orphan sweep ≤ 90s; rate limit at message 11; reconnect sync; both themes at
380px match the mockup; "Hermes" absent from the built bundle.
