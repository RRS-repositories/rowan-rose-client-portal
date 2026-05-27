# Rowan Rose Client Portal — Frontend Design Brief

**For:** Claude Code (frontend exploration & build phase)
**Owner:** Brad Forbes, Rowan Rose Solicitors / Fast Action Claims
**Scope of this brief:** Frontend UI only. No backend wiring, no CRM integration, no auth logic. Those are separate later milestones.

---

## 1. Mission

Build a client portal frontend that lets clients of Rowan Rose Solicitors (consumer credit complaint firm) track their irresponsible-lending claims, upload required documents, accept settlement offers, and receive updates — across **iOS, Android, and web**, from a single approved design language.

This brief drives a **two-phase frontend workflow**:

1. **Phase A — Design Exploration.** Produce 4–5 distinct, framework-agnostic HTML/CSS prototypes (different aesthetic directions). Brad picks one. No stack decision yet.
2. **Phase B — Production Frontend Build.** Port the approved aesthetic into a production cross-platform stack. Wire up navigation, state, animations, theming. Backend integration is out of scope here — mock all data.

**Do not skip Phase A.** Going straight to a framework build is how every portal ends up looking like the same shadcn template.

---

## 2. The Audience (read this twice)

Clients are aged **18 to 90+**. Most are:

- Not tech-savvy. Many will use this on a 4-year-old Android phone or a tablet a grandchild set up for them.
- Stressed. They came to the firm because they were sold loans they couldn't afford. The portal cannot feel like a fintech app. It cannot feel cold, clinical, or financial-services-corporate. It also cannot feel patronising or "designed for old people."
- Visually impaired in many cases — cataracts, presbyopia, low contrast sensitivity, reduced fine motor control.
- Often opening the app once a month, not every day. The interface has to make sense without them having learned anything.

This drives **every** design decision below. If a design choice fails any of these constraints, it's wrong, regardless of how trendy it looks.

### Hard accessibility floor (non-negotiable)

- Minimum body text size: **17px on mobile, 18px on web** (not 14, not 16).
- Tap targets: **minimum 48×48 dp on Android, 44×44 pt on iOS**, with **8px minimum spacing** between targets.
- Colour contrast: **WCAG AAA where possible (7:1 for body text)**, AA minimum (4.5:1).
- **Never rely on colour alone** to convey status. Always pair with text label, icon, or pattern.
- Support **system font scaling** up to 200%. Layout must not break.
- Support **reduced motion** preference. All animations must have a no-motion fallback.
- Focus indicators must be **visible and high-contrast** for keyboard navigation on web.
- All form inputs need persistent visible labels (not placeholder-only).
- Error messages: **plain English, no jargon, no error codes shown to user.**

### Soft accessibility (strongly preferred)

- Optional "Large Text" mode in settings that boosts everything by 20%.
- Voice-input compatibility on text fields (don't block autocomplete or speech-to-text).
- Single-column layouts on mobile. Multi-column only on tablet/desktop.
- Plain English everywhere. No legal jargon visible to client. Internal jargon like "DSAR", "FRL", "FOS" must be either replaced or accompanied by a one-line plain-English explanation on first appearance.

---

## 3. Phase A — Design Exploration Workflow

### What to produce

A folder of **4–5 standalone HTML prototypes**, each a single self-contained `.html` file (CSS inline or in a single `<style>` block, no build step). Each prototype shows the **same three screens** so Brad can compare directly:

1. **Dashboard / Home** (with the sticky "What We Need From You" card and 2–3 claim summary cards)
2. **Claim Detail** (with phase progress tracker and plain-English timeline)
3. **Document Upload** (with drag-and-drop area and outstanding requirements list)

Each prototype = one aesthetic direction. **They must be genuinely distinct from each other.** If two prototypes could be swapped without anyone noticing, you've failed.

### Suggested aesthetic directions (pick 4–5, vary them)

Use the **`frontend-design` skill** when generating each prototype. Commit hard to one direction per prototype:

- **Refined Minimal** — generous white space, one strong serif display font, monochrome with a single accent colour, subtle hairline dividers. Think Stripe-meets-Penguin-Classics. Restraint over decoration.
- **Editorial / Magazine** — strong typographic hierarchy, asymmetric grid, oversized numerals for amounts and progress percentages, pull-quote treatments for status messages. Think Bloomberg Businessweek + Apple Newsroom.
- **Warm & Humanist** — earthy palette (clay, sage, off-white, deep navy), rounded but not childish geometry, friendly grotesque sans (Söhne, Untitled Sans, GT Walsheim), illustrated empty states. Think Calm app meets a good independent bookshop. **Likely the strongest fit for the 18–90 audience — but still validate against the others.**
- **Civic / Institutional** — clear, calm, government-grade clarity (GOV.UK design system as reference, not copy). High contrast, big tap targets, no decorative flourish. Trust through directness.
- **Soft Neumorphic / Tactile** — depth and physicality via shadows and gradients, but restrained (not the 2020 neumorphism cliché). Buttons feel pressable. Subtle.
- **Brutalist Utility** — monospace headers, hard rules, no rounded corners, system black on system white, accent in a single saturated colour. Risky for the audience but worth seeing as a comparison anchor.

**Do not** include a "default shadcn / Tailwind / Inter / purple-gradient" direction. That's the ghost we're exorcising.

### What each prototype must include

For each of the three screens:

- Light mode AND dark mode visible side-by-side OR via a toggle inside the prototype.
- A mobile viewport version (380×800) AND a desktop viewport version (1280×800), either via responsive media queries or two separate sections in the file.
- At least one **micro-interaction prototyped** (hover state on a card, focus state on a button, a fake "uploading" state for the upload zone). CSS-only is fine.
- A short comment block at the top of the file describing: typography choices, colour palette, spacing system, aesthetic thesis in 2–3 sentences.

### Mock data to use

Use realistic Rowan Rose claim data, not Lorem Ipsum:

- Client: "Sarah Holden" or "Michael Okafor" (vary across prototypes, not all the same name)
- Claim ID format: `RR-676687-554/21`
- Lenders to feature: Vanquis, 118 118 Money, Lending Stream, QuidMarket, Loans 2 Go, NewDay Aqua
- Phases to show (one per claim card): Getting Started, Investigation, Claim In Progress, Offer Received
- Status messages: pull from the Claim Status Mapping table in section 7 below.
- Outstanding requirements to list: ID Verification, Proof of Address, Bank Statements (Aug 2023), Questionnaire

### How Brad will review

Brad will look at all prototypes side-by-side, pick one direction (or pick a combination — "the layout of #2 with the palette of #3"), and then signal "go." Only then does Phase B start.

---

## 4. Phase B — Production Frontend Build

**Do not start Phase B until the design direction is explicitly approved.**

### Stack — shortlist (Brad to choose at start of Phase B)

The old portal spec recommended Expo + NativeWind + shadcn + Framer Motion. Brad has explicitly rejected this as "the same common stack." Three fresh candidates:

| Option | Pros | Cons | Best for |
|--------|------|------|----------|
| **Expo + Tamagui** | Single RN/web codebase, compiler-optimised, fresh component vocabulary, dark mode and themes built in, strong animation primitives | Smaller ecosystem than NativeWind, learning curve | Brad's most likely pick — familiar RN ecosystem without the shadcn look |
| **Flutter** | True single codebase iOS/Android/Web, animations first-class, Material 3 + Cupertino built in, 60fps on old devices | Web target still weaker than native web, less of an existing JS-ecosystem fit | If smooth animation on cheap phones is the top priority |
| **Kotlin Multiplatform + Compose Multiplatform** | Truly modern, JetBrains-backed, single codebase for everything including desktop | Smaller community, fewer libraries, steeper for a JS-first team | If you want to commit hardest to "not the common stack" |

**Default recommendation if Brad doesn't specify: Expo + Tamagui.** Closest to existing JS/React expertise without the generic look.

### Build out the following screens (in this order)

Implement all screens with **mock data only**. No API calls. State managed locally. Fake delays of 600–1200ms simulate network so loading states are testable.

1. **Splash / launch** — branded, smooth fade into auth or dashboard.
2. **Auth flow** — Register, Login, OTP entry, Password reset. UI only, no real auth. Form validation runs client-side.
3. **Dashboard** — sticky "What We Need From You" card at top, claim summary cards below, notification badge, quick actions.
4. **Claim Detail** — animated phase progress tracker, plain-English timeline, financial summary (progressive reveal based on phase), action items.
5. **Documents** — list of uploaded docs, drag-and-drop upload zone, outstanding requirements list, mock upload progress, file-type validation client-side.
6. **Messages** — thread view per claim, send/receive UI, unread indicators, typing indicator animation.
7. **Profile / Settings** — read-only personal details, password change form, notification preferences, theme toggle (Light / Dark / System), large-text toggle.
8. **FAQ / Help** — searchable accordion list of common questions.
9. **Empty states** — every screen needs a thoughtful empty state, not a blank panel. Use illustrated or typographic empty states matching the approved aesthetic.
10. **Error states** — offline indicator, failed upload state, session expired state. Plain English only.

### Theming

- Light, Dark, and System modes. Persisted to localStorage / AsyncStorage.
- Theme transition must be a smooth crossfade, never a hard flash.
- Define the palette as design tokens (CSS variables on web, theme object on native). No hard-coded hex values in components.

### Motion

- **Page transitions:** slide (mobile), fade or shared-element (web/tablet).
- **Phase progress tracker:** animate phase advancement when status changes. Use spring physics, not linear easing.
- **Skeleton loaders:** every async surface (claims list, documents list, messages thread) gets a skeleton. No blank screens, no spinners-only.
- **Pull-to-refresh** on mobile screens with lists.
- **Toast notifications:** slide in from top on mobile, from top-right on desktop. Auto-dismiss after 5 seconds, with a manual close affordance.
- **Reduced motion:** ALL of the above must have a no-motion fallback that uses opacity-only or instant transitions.

### Component inventory to build

Once the aesthetic is locked, build these as reusable components:

- Button (primary, secondary, ghost, destructive — all with loading state, disabled state, icon variants)
- Card (with optional badge, optional action footer)
- Input (text, email, password, OTP, with persistent label, error state, helper text)
- Select / Dropdown (accessible, keyboard navigable)
- Modal / Sheet (mobile = bottom sheet, web = centred modal)
- Phase Progress Tracker (custom — see section 7)
- Document Upload Zone (drag-drop on web, picker on mobile)
- Timeline Entry (plain-English, with icon and timestamp)
- Claim Summary Card
- "What We Need From You" sticky card with red badge counter
- Notification toast
- Empty state component (illustrated or typographic, matching aesthetic)
- Theme toggle
- Skeleton loader variants for each list/card type

---

## 5. Critical UX Rules

These override any aesthetic decision. If the aesthetic and the UX rule conflict, the UX rule wins.

1. **The "What We Need From You" card is sacred.** It is the single biggest lever for reducing the chase workflow. It must be:
    - Always visible at the top of the dashboard
    - Coloured prominently (warning amber or signal red, depending on palette)
    - Show a count badge for outstanding items
    - Not dismissible
    - One-tap to the relevant action

2. **Status messages are written for the client, not the firm.** Never show internal status codes ("DSAR Sent", "FRL Received") to the client. Always use the client-facing phase message from the mapping in section 7.

3. **Timeline entries are narrative, not log entries.** Not: "Status changed to DSAR Sent — 14 Jan 2026." Yes: "We wrote to Vanquis Bank requesting your lending records — 14 Jan 2026."

4. **Financial information is progressive.** Don't show fee breakdowns before there's an offer. See section 8.

5. **No empty inboxes.** Every list view has a useful empty state that explains what will appear here and, where possible, prompts the next action.

6. **Errors are explained, not coded.** Never show a HTTP status or error stack trace. Show: "We couldn't upload your document right now. Please check your connection and try again — or contact us if it keeps happening."

7. **Hidden statuses stay hidden.** See section 7 list. Never leak internal sales-pipeline language.

---

## 6. Information Architecture

### ID formats (mock data must follow these)

- Client ID: `RR-XXXXXX-XXX` → e.g. `RR-676687-554`
- Claim ID: `RR-XXXXXX-XXX/NN` → e.g. `RR-676687-554/21`
- One client → many claims (one-to-many). Each claim has its own status, documents, financials, timeline.

### Outstanding requirements (client level, drives the sticky card)

| Requirement | Display |
|-------------|---------|
| ID Verification | "We need a photo of your ID (passport or driving licence)" |
| Proof of Address | "We need a recent bill or bank statement showing your address" |
| Questionnaire | "Please complete the affordability questionnaire — about 5 minutes" |
| Extra Lender Form | "Please add any other lenders you'd like us to investigate" |
| Bank Statements (per claim) | "We need your bank statements for [month] [year]" |

---

## 7. Claim Status Mapping (CRITICAL — use these exact client-facing messages)

### Client-facing phases (the only thing the client ever sees)

| Phase (shown) | Internal Status (never shown) | Client Message |
|---------------|------------------------------|----------------|
| Getting Started | Onboarding | We're setting up your claim. Please check the items we need from you below. |
| Getting Started | Documents Required | We need some documents from you to get started. Please upload the items listed below. |
| Getting Started | Awaiting Bank Statements | We're waiting for your bank statements. Once they arrive we'll begin our assessment. |
| Investigation | DSAR Sent | We've asked the lender for your full lending records. This usually takes about 30 days. |
| Investigation | DSAR Received | Your lending records have arrived. We're going through them now. |
| Investigation | DSAR Chased | We're chasing the lender — they haven't sent your records within the time they're supposed to. |
| Claim In Progress | Complaint Submitted | Your complaint has gone in. We're now waiting for the lender's formal response. |
| Claim In Progress | Complaint Chased | We're chasing the lender for their response. |
| Claim In Progress | FRL Received | The lender has responded. We're reviewing what they've said. |
| Claim In Progress | Counter Response Sent | We've sent a detailed challenge to the lender's response. |
| Escalated to Ombudsman | FOS Submitted | Your case has gone to the Financial Ombudsman for an independent decision. |
| Escalated to Ombudsman | FOS Chased | We're chasing the Ombudsman for an update. |
| Escalated to Ombudsman | FOS Awaiting Decision | The Ombudsman is reviewing your case. We'll let you know as soon as there's a decision. |
| Offer Received | Offer Received | An offer has been made. Please review the details and the acceptance form below. |
| Offer Received | Offer Accepted | You've accepted the offer. We're now waiting for payment from the lender. |
| Offer Received | Offer Rejected | The offer was rejected and we're pursuing the next step on your behalf. |
| Settlement | Payment Received | Payment has arrived from the lender. We're processing your settlement now. |
| Settlement | Fee Deducted | Our fee has been deducted. Your payment is being prepared. |
| Completed | Client Paid | All done — your settlement has been paid to you. See the breakdown below. |
| Closed | Claim Closed | This claim is closed. If you have any questions, please contact us. |

### Phase progress tracker order (the visual element)

The tracker on the Claim Detail screen shows these 7 phases in order, with the current one highlighted:

`Getting Started → Investigation → Claim In Progress → Escalated to Ombudsman (only if escalated) → Offer Received → Settlement → Completed`

### Hidden internal statuses — must NEVER appear in the UI

`New Lead`, `Contact Attempted`, `Not Qualified`, `Sale`, `Counter Team`, `Weak Case Cannot Continue`. Treat as `null` or skip from any list/feed if encountered.

---

## 8. Financial Visibility (Progressive Reveal)

| Phase | What's shown in financial summary |
|-------|-----------------------------------|
| Before Offer Received | Nothing. Hide the financial summary section entirely. |
| Offer Received | Offer amount from lender. No fee maths yet. |
| Payment Received | Gross settlement amount received. |
| Fee Deducted | Gross amount, fee %, fee amount, net amount to client. |
| Client Paid | Full breakdown: gross settlement, fee %, fee amount, net paid, payment date. |

### Fee bands (for mock data realism only — don't show on screen yet)

| Settlement | Fee % | Cap |
|-----------|-------|-----|
| £1 – £1,499 | 30% | £420 |
| £1,500 – £9,999 | 28% | £2,500 |
| £10,000 – £24,999 | 25% | £5,000 |
| £25,000 – £49,999 | 20% | £7,500 |
| £50,000+ | 15% | £10,000 |

All figures +VAT. Display VAT inclusively when fees are shown to clients.

---

## 9. Branding

**Firm:** Rowan Rose Solicitors, trading as Fast Action Claims.
**Brad to provide:** logo files (SVG preferred), official brand colours, official typeface if any.
**If unavailable during prototyping:** use a placeholder wordmark and a serif-or-warm-sans typeface choice that supports the chosen aesthetic. Do not default to Inter or Roboto.
**Footer text (legal):** Rowan Rose Ltd (12916452), SRA 8000843. Correspondence: City Point, 701 Chester Road, Stretford, Manchester, M32 0RW. Contact: contact@rowanrose.co.uk · 0161 505 0150.

---

## 10. Out of Scope for This Brief (Explicit Exclusions)

These are intentionally NOT part of this work. Don't add them, don't stub them with real logic, don't generate backend code for them:

- No real authentication. Mock the auth screens; "login" just sets a fake auth flag and routes to dashboard.
- No CRM integration, no API calls, no database. All data is mock JSON in the frontend.
- No push notification setup. The notification UI exists; the actual delivery doesn't.
- No file upload to S3. The upload zone shows progress and a success state but does nothing with the file.
- No e-signature legal logic. The acceptance form UI exists; submission is mocked.
- No WebSockets, no real-time. Mock updates with timers if needed for demo.
- No analytics, no error monitoring (Sentry etc), no feature flags.
- No CI/CD setup.

These come back in scope at a future milestone, once the frontend is approved and the stack is locked.

---

## 11. Recommended MCP & Skill Setup for Claude Code

Tell Claude Code to use these for this project:

- **`frontend-design` skill** — invoke for every prototype variant in Phase A and every screen in Phase B. This is the most important one. It forces commitment to an aesthetic direction and pushes against generic AI-template output.
- **Chrome DevTools MCP** — for the visual feedback loop. Claude Code loads the prototype, takes screenshots, checks contrast, inspects the accessibility tree. Critical when iterating on Phase A prototypes.
- **21st.dev Magic MCP** — useful for generating component variants when stuck on a specific element ("give me 5 phase tracker designs").
- **Context7** — for fetching latest docs of whichever framework lands in Phase B (Tamagui, Flutter, Compose). Brad already has this connected.

**Avoid:** shadcn MCP (pushes the project back to the generic look), Figma MCP (no Figma source of truth exists for this project).

---

## 12. Acceptance Criteria

**Phase A is done when:**

- 4–5 distinct standalone HTML prototype files exist, each showing Dashboard, Claim Detail, and Document Upload screens.
- Each prototype has light + dark mode and mobile + desktop viewports.
- Each prototype passes WCAG AA contrast minimum.
- A README in the prototype folder summarises each aesthetic direction in 2–3 sentences.
- Brad has reviewed and chosen a direction (or a hybrid).

**Phase B is done when:**

- All 10 screens (section 4) are built in the chosen production stack.
- All work with mock data, on iOS, Android, and web from a single codebase.
- Light, dark, and system theme modes all work with smooth transitions.
- Reduced motion preference is respected globally.
- All tap targets meet minimum size. All text meets minimum size and scales to 200%.
- All client-facing copy uses the plain-English messages from section 7. No internal status codes leak.
- A staging build is deployable for Brad to demo on a real phone.

---

## 13. Workflow Notes for Claude Code

- **Don't ask Brad to make Phase B decisions in Phase A.** Stack choice waits.
- **Don't bundle Phase A and Phase B in one go.** Generate prototypes, stop, wait for the pick.
- **When generating prototypes, vary them genuinely.** If two of the five could swap without anyone noticing, regenerate.
- **For accessibility, run the Chrome DevTools MCP audit on every prototype before declaring it done.**
- **When in doubt about copy, default to plainer English, not more technical.** This audience does not need to be impressed; they need to be reassured.
