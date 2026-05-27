# Rowan Rose Client Portal — Project Root Instructions

You are working on a client portal for **Rowan Rose Solicitors** (trading as **Fast Action Claims**), a UK consumer credit complaint firm. The portal will be used by clients aged 18 to 90+ to track their irresponsible-lending claims, upload documents, accept settlement offers, and receive updates across **iOS, Android, and web**.

This is **Brad Forbes**'s project. Brad is the IRL Manager and Team Manager at the firm and has built the firm's entire CRM stack himself (AWS / Node.js / PostgreSQL / React, ~90k contacts, ~108k claims). He knows what he wants and moves fast.

---

## Project Structure

```
/
├── CLAUDE.md          # This file — read first
├── README.md          # Human-readable overview
├── frontend/          # ACTIVE — see frontend/CLAUDE.md
├── backend/           # NOT STARTED — see backend/CLAUDE.md
└── Notes/             # Brad's Obsidian vault — read for context, don't edit unprompted
```

---

## Critical Workflow Rules

### 1. Frontend first. Backend later. Period.
Brad has explicitly sequenced this: frontend gets fully built and approved before any backend work begins. If a user request would have you touching `backend/` while `frontend/` is not yet signed off, **stop and ask before proceeding**.

### 2. Two-phase frontend with a hard stop in the middle
Inside `frontend/`, work is split into:
- **Phase A** — design exploration (4–5 HTML/CSS prototype variants)
- **Phase B** — production build (cross-platform app)

**Phase B does not start until Brad explicitly approves a Phase A direction.** Don't auto-continue. Read `frontend/CLAUDE.md` for the gate details.

### 3. No scope creep
Out-of-scope items during the frontend phase are NOT to be implemented, even if they seem trivial:
- No real authentication
- No real CRM integration / API calls
- No real S3 / file upload backend
- No real push notification delivery
- No WebSockets / real-time
- No analytics, error monitoring, CI/CD

All data is mocked. See section 10 of `frontend/Client_Portal_Frontend_Brief.md`.

### 4. Brad's Obsidian vault (`Notes/`) is his workspace, not yours
You may **read** notes for context. Do not **write or edit** notes there unless Brad explicitly asks you to.

---

## The Audience (Read This Once Per Session)

Clients are aged **18 to 90+**. Most are:
- Not tech-savvy. Many use a 4-year-old Android or a tablet a grandchild set up.
- Visually impaired (cataracts, presbyopia, reduced contrast sensitivity).
- Stressed — they came to the firm because they were sold loans they couldn't afford.
- Opening the app once a month, not every day.

The accessibility floor in section 2 of the brief is **non-negotiable**:
- Body text ≥17px mobile, ≥18px web
- Tap targets ≥44pt iOS / ≥48dp Android
- WCAG AAA contrast where possible, AA minimum
- Never colour-alone for status
- Respect reduced motion preference
- Support 200% font scaling without breaking layout

If a design choice fails any of these, change the design, not the floor.

---

## Tools, Skills & MCPs You Should Use

- **`frontend-design` skill** (bundled with Claude Code) — invoke for EVERY UI generation in this project. This is the single most important tool here. It pushes against generic AI aesthetics and forces commitment to a bold direction.
- **Chrome DevTools MCP** — for visual feedback, screenshots, contrast verification, and a11y tree inspection during Phase A iteration.
- **21st.dev Magic MCP** — for component variant exploration when stuck on a specific element.
- **Context7** — for fetching latest framework docs (already connected). Use it before relying on memory for framework APIs.

**Do NOT use the shadcn MCP for this project.** Brad has explicitly rejected the generic shadcn / Tailwind / Inter / purple-gradient aesthetic. Pulling shadcn components defeats the entire premise.

---

## Communication Style with Brad

- Brad is technical and runs his own dev work. Don't over-explain basics. Don't pad responses.
- Get to the point. Avoid hedging.
- Don't ask "would you like me to..." when the next step is obvious. Do the work.
- When you need a decision, list the options with your recommendation. Don't dump open questions on him.
- When a milestone is done: summarise in 3–5 lines, list any open items, stop. Don't tail off with "anything else?"
- If you hit a blocker, state the blocker and propose an option. Don't open-question him.
- No emojis unless he uses them first. No exclamation marks. No "I'd be happy to..."

---

## Firm Context (Reference Only — Don't Surface Unless Relevant)

- **Firm:** Rowan Rose Solicitors trading as Fast Action Claims
- **SRA:** 8000843 · **Company No.:** 12916452
- **Correspondence:** City Point, 701 Chester Road, Stretford, Manchester, M32 0RW
- **Contact:** contact@rowanrose.co.uk · 0161 505 0150 · www.rowanrose.co.uk
- **Practice area:** consumer credit complaints — irresponsible lending, overdraft mis-selling, gambling harm, PBA claims
- **Lenders involved (frequent):** Vanquis, 118 118 Money, Loans 2 Go, Lending Stream (Gain Credit LLC), QuidMarket, NewDay (Aqua/Marbles/Fluid), Lendable, Moneyboat, Salad Finance, Cashfloat, Fernovo, Bamboo, Oakbrook/Likely Loans, Everyday Lending
- **Relevant regulations:** FCA CONC 5.2A, FG21/1, DISP rules, s.140A–140C CCA 1974
- **Fee bands (all +VAT):** Band 1 £1–1,499 → 30% (cap £420); Band 2 £1,500–9,999 → 28% (cap £2,500); Band 3 £10k–24,999 → 25% (cap £5,000); Band 4 £25k–49,999 → 20% (cap £7,500); Band 5 £50k+ → 15% (cap £10,000)

---

## Existing Tech Stack (For Context When Backend Phase Begins)

Brad's CRM runs on:
- AWS hosting · Node.js · PostgreSQL · React
- Windmill (workflow automation, replaced n8n for most workers)
- Ollama/Gemma local AI inference + Gemini failover
- Office 365 email · Twilio SMS · Mattermost notifications · OnlyOffice docs · S3 storage
- 90k+ contacts, 108k+ claims

The portal will eventually integrate as a read-mostly layer on this CRM. Not your problem during the frontend phase, but useful to know it's a real production system, not a greenfield build.
