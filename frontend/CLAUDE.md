# Frontend — Rowan Rose Client Portal

**Read this file AND `Client_Portal_Frontend_Brief.md` at the start of every session.** The brief is the source of truth for what gets built. This file is the workflow rules for how to build it.

---

## Two-Phase Workflow (Hard Gate Between Them)

### Phase A — Design Exploration

**Output:** 4–5 standalone HTML/CSS prototype files in `prototypes/`, plus a `prototypes/README.md` summary.

**Each prototype shows the same 3 screens** in a distinct aesthetic direction:
1. Dashboard / Home (with sticky "What We Need From You" card + 2–3 claim summary cards)
2. Claim Detail (with phase progress tracker + plain-English timeline)
3. Document Upload (with drag-drop zone + outstanding requirements list)

**Requirements per prototype:**
- Single self-contained `.html` file (inline CSS, no build step)
- Light mode AND dark mode (either side-by-side or via toggle inside the file)
- Mobile viewport (380×800) AND desktop viewport (1280×800)
- At least one prototyped micro-interaction (CSS-only is fine)
- Comment block at top: typography choices, colour palette, spacing system, aesthetic thesis in 2–3 sentences
- Realistic mock data (Rowan Rose claim data — see section 3 of brief, NOT Lorem Ipsum)
- WCAG AA contrast minimum (verify with Chrome DevTools MCP)

**Phase A is done when:**
- [ ] 4–5 prototype HTML files exist in `prototypes/`
- [ ] `prototypes/README.md` summarises each direction
- [ ] All prototypes pass WCAG AA contrast (verified)
- [ ] Brad has reviewed and explicitly named a direction

### 🛑 HARD STOP between Phase A and Phase B

When Phase A is delivered, **stop and wait**. Do not start Phase B until Brad says one of:
- "approved — go with direction X"
- "approved — direction X with the palette of direction Y"
- "go" / "proceed with phase B"

If his response is ambiguous, ask: *"Just to confirm — Phase B with direction X, stack [Tamagui/Flutter/KMP]?"* Then wait.

### Phase B — Production Build

**Output:** cross-platform app in `app/` using the stack Brad picks at the start of Phase B.

**Stack candidates** (see brief section 4):
- **Expo + Tamagui** (default recommendation if Brad doesn't specify)
- **Flutter**
- **Kotlin Multiplatform + Compose Multiplatform**

**Screens to build** (in this order):
1. Splash / launch
2. Auth flow (Register, Login, OTP, Password reset) — UI only, no real auth
3. Dashboard
4. Claim Detail
5. Documents
6. Messages
7. Profile / Settings
8. FAQ / Help
9. Empty states for every list
10. Error states (offline, failed upload, session expired)

All with **mock data only**. Fake delays of 600–1200ms to simulate network so loading states are testable.

**Theming:** Light, Dark, System modes with smooth crossfade transitions. Design tokens via CSS variables (web) or theme object (native). No hardcoded hex.

**Motion:** Page transitions, phase tracker animation, skeleton loaders on every async surface, pull-to-refresh on lists, slide-in toasts. Reduced-motion fallback for all of it.

---

## Folder Layout

```
frontend/
├── CLAUDE.md                              # This file
├── Client_Portal_Frontend_Brief.md        # The brief — re-read every session
├── prototypes/                            # Phase A output
│   ├── README.md                          # Summary of each direction
│   ├── 01-<direction-name>.html
│   ├── 02-<direction-name>.html
│   ├── 03-<direction-name>.html
│   ├── 04-<direction-name>.html
│   └── 05-<direction-name>.html
└── app/                                   # Phase B output (created at start of B)
    └── (production code goes here)
```

---

## Skills & MCPs (Use These, Not Defaults)

- **ALWAYS invoke the `frontend-design` skill** before generating any UI. Every prototype, every screen. It commits you to a bold aesthetic direction and stops the generic AI-template drift.
- **Chrome DevTools MCP** — load each prototype, take screenshots, verify contrast ratios, inspect a11y tree. Do this before declaring a prototype done.
- **21st.dev Magic MCP** — when stuck on a component variant, use it for inspiration ("give me 5 phase tracker designs"). Don't use it as the primary generator — it converges on similar looks.

---

## Anti-Patterns (Don't Ship These)

- Inter / Roboto / Arial / system-font defaults
- Purple gradient on white background
- shadcn default look or any "looks like shadcn" output
- Bootstrap, MUI, Chakra
- CSS-in-JS (Styled Components, Emotion)
- Tap targets smaller than 44pt iOS / 48dp Android
- Body text smaller than 17px mobile / 18px web
- Status codes ("DSAR Sent", "FRL Received") shown to clients — use plain-English mapping from brief section 7
- Empty states that are just blank panels
- Spinners-only loading (use skeleton loaders)
- Hard flash on theme toggle (must crossfade)
- Drawn-signature widgets (use typed-name + checkbox per brief section 3.5)

---

## When Generating Each Prototype

1. Invoke the `frontend-design` skill.
2. Pick one aesthetic direction from the brief (Refined Minimal, Editorial, Warm Humanist, Civic, Soft Neumorphic, Brutalist Utility) — or propose a new one if better, with a 2-sentence justification.
3. **Commit hard.** Don't hedge between styles. If you find yourself softening the direction, lean harder into it instead.
4. Build all 3 screens (Dashboard, Claim Detail, Document Upload).
5. Include light + dark mode and mobile + desktop viewports.
6. Use realistic mock data: client names like "Sarah Holden" or "Michael Okafor" (vary across prototypes — don't reuse), claim IDs in `RR-XXXXXX-XXX/NN` format, lenders from the firm's actual list (Vanquis, 118 118 Money, Lending Stream, QuidMarket, etc.), client-facing phase messages from the mapping table.
7. Verify contrast with Chrome DevTools MCP before declaring done.
8. Add the top-of-file comment block (typography, palette, spacing, thesis).

---

## When Reporting to Brad

After generating the prototype set:
- **Don't ask which is his favourite.** He'll review and tell you.
- Summarise each prototype in **one line** in your reply (e.g. "01 — Refined Minimal: ivory + ink, Tiempos headline, restrained motion").
- List the file paths.
- Stop.

After Phase B work:
- State what's done, what's mocked, and the run command to demo on a real device.
- Don't offer to add features. Don't ask if he wants more. Brad will direct.

---

## Critical UX Rules (Override Any Aesthetic Choice)

1. The "What We Need From You" sticky card is non-negotiable on the Dashboard. Always visible, prominent colour, count badge, not dismissible.
2. Status messages use the plain-English mapping from brief section 7. Never leak internal codes.
3. Timeline entries are narratives ("We wrote to Vanquis Bank requesting your lending records"), not log entries ("Status changed to DSAR Sent").
4. Financial info is progressively revealed (brief section 8). Don't show fee maths before there's an offer.
5. Every list view has a thoughtful empty state, not a blank panel.
6. Errors are explained in plain English. Never show HTTP codes or stack traces.
7. Hidden internal statuses (`New Lead`, `Contact Attempted`, `Not Qualified`, `Sale`, `Counter Team`, `Weak Case Cannot Continue`) NEVER appear in the UI.

---

## What's Out of Scope (Don't Wander)

- Real auth, real OTP delivery, real session management
- Real CRM API calls
- Real S3 uploads (mock the progress bar, mock the success state)
- Real push notifications
- WebSockets / real-time updates
- E-signature legal logic
- Analytics, Sentry, feature flags
- CI/CD setup
- App Store / Play Store submission tooling

If a user request would have you implementing any of these during the frontend phase, stop and confirm with Brad.
