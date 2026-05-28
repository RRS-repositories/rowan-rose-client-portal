# Rowan Rose Client Portal — Phase 1.6: Claim Detail View

<context>
Phases 1.1 (design system), 1.2 (layout shell, navigation, routing), 1.3 (registration flow), 1.4 (login, logout, password reset, session management, protected routes), and 1.5 (dashboard with claims cards, mock data for 4 claims, statusMapping utility, formatDate utilities, skeleton loaders, useFetch hook) are all complete.

This is Phase 1.6. You are building the Claim Detail page — the full view that opens when a client clicks on a claim card from the dashboard. This page shows everything about a single claim: a visual progress stepper, the current status message, a chronological timeline of events, conditional financial information, and any action items the client needs to complete.

The mock data created in Phase 1.5 (src/api/mocks/data.ts) already contains full claim objects with timelines and financials. This phase uses that data via the existing fetchClaimById(id) mock API function.
</context>

<tasks>

## Task 1: Progress Stepper Component

Create a `ProgressStepper.tsx` component in `src/components/ui/` that visually represents the 8 client-facing claim phases as a step-by-step progress bar.

The 8 phases in order:
1. Getting Started
2. Investigation
3. Claim In Progress
4. Escalated to Ombudsman
5. Offer Received
6. Settlement
7. Completed
8. Closed

Props:
```typescript
interface ProgressStepperProps {
  currentPhase: string;      // e.g. "Investigation"
  isClosed?: boolean;        // If true, show "Closed" styling regardless of phase
}
```

Desktop layout (1024px+):
- Horizontal row of 8 circles connected by lines
- Each circle: 36px diameter, contains step number or icon
- Connecting lines between circles: 2px height
- Below each circle: phase label in font-size-xs
- Total width: spans the full content area

States for each step:
- **Completed** (phases before current): brand-primary filled circle, white checkmark icon inside, brand-primary connecting line to the next step
- **Current** (active phase): brand-primary border (3px), brand-primary number inside, subtle pulse or glow animation, brand-primary background at 10% opacity. Connecting line from previous step is brand-primary, connecting line to next step is var(--border) dashed
- **Future** (phases after current): var(--border) circle border, text-muted number inside, var(--border) dashed connecting line
- **Closed** (special): if the claim is closed, show all steps as grey with the "Closed" step having a special icon (XCircle or Lock). Override all previous step colours to grey/muted

Tablet layout (768px–1023px):
- Same horizontal layout but reduce circle size to 28px
- Hide phase labels, show them as tooltips on hover/focus

Mobile layout (below 768px):
- Switch to vertical stepper (circles stacked vertically with connecting lines between them)
- Phase labels shown to the right of each circle
- Current phase visually prominent
- Compact: only show 2 completed steps above current, current step, and 2 future steps below. Add "Show all steps" expand button to reveal the full list

Accessibility:
- Container: role="navigation", aria-label="Claim progress"
- Each step: aria-label describing the step (e.g. "Step 2: Investigation — completed" or "Step 3: Claim In Progress — current step")
- Current step: aria-current="step"

## Task 2: Timeline Component

Create a `Timeline.tsx` component in `src/components/ui/` that displays a chronological list of events for a claim.

Props:
```typescript
interface TimelineProps {
  events: TimelineEvent[];   // From the mock data type defined in Phase 1.5
  maxVisible?: number;       // Default: 5 — show this many initially
}
```

Layout:
- Vertical list with a continuous line on the left side connecting all events
- Each event is a row with:
  - Left: circle icon on the timeline line (16px diameter), colour-coded by event type
  - Middle: event content
    - Title in font-size-base, bold, text-primary
    - Description in font-size-sm, text-secondary
  - Right: date and time in font-size-xs, text-muted
- Most recent event at the top (reverse chronological)
- Gap between events: 24px

Event type icons and colours:
| Type | Icon (lucide-react) | Colour |
|------|---------------------|--------|
| status_change | RefreshCw | brand-primary |
| document_uploaded | Upload | status-getting-started (blue) |
| message_received | MessageSquare | status-investigation (purple) |
| message_sent | Send | status-in-progress (orange) |
| offer_received | Gift | status-offer (green) |
| payment | DollarSign (or PoundSterling) | status-completed (dark green) |

Show/hide behaviour:
- Initially show maxVisible events (default 5)
- If there are more events, show a "Show earlier events" button at the bottom
- Clicking it expands to show all events with a smooth animation
- Button changes to "Show fewer events" when expanded
- Accessible: aria-expanded on the toggle button

Empty state:
- If no events: show "No activity recorded yet." in text-muted

## Task 3: Financial Summary Component

Create a `FinancialSummary.tsx` component in `src/components/ui/` that displays the financial breakdown of a claim. This component is only shown from the "Offer Received" phase onwards — it is completely hidden before that.

Props:
```typescript
interface FinancialSummaryProps {
  financials: ClaimFinancials;  // From Phase 1.5 types
  currentPhase: string;
}
```

Progressive visibility rules (from the spec):
| Phase | What to Show |
|-------|-------------|
| Before Offer Received | Do NOT render this component at all |
| Offer Received | Offer amount only |
| Settlement (Payment Received) | Offer amount + Gross settlement amount |
| Settlement (Fee Deducted) | Gross amount + Fee percentage + Fee amount + Net to client |
| Completed (Client Paid) | Full breakdown: Gross + Fee % + Fee amount + Net paid + Payment date |

Layout:
- Card (using Card component) with heading "Financial Summary"
- PoundSterling or Banknote icon next to heading
- Data displayed as labelled rows:
  - Label on left (text-secondary, font-size-sm)
  - Value on right (text-primary, font-size-lg for the main amount, font-size-base for others)
- Main amount (offer or gross settlement) displayed prominently: font-size-2xl, bold, brand-primary colour
- Fee amount shown in text-muted (it is a deduction)
- Net to client shown in brand-primary, bold — this is the key figure for the client
- Payment date formatted using formatUKDate from Phase 1.5

Divider line between the gross amount section and the fee/net section for visual clarity.

If a value is null (not yet available for the current phase), do not show that row at all.

Accessibility:
- Heading: proper heading level (h3 or aria-label on the card)
- All values associated with their labels via table structure or dl/dt/dd elements
- Currency values: aria-label including "pounds" (e.g. aria-label="Offer amount: two thousand four hundred and fifty pounds") — or simply use proper currency formatting that screen readers handle well (£2,450.00)

## Task 4: Action Items Component

Create an `ActionItems.tsx` component in `src/components/ui/` that shows any pending actions the client needs to take for this specific claim.

Props:
```typescript
interface ActionItemsProps {
  claim: Claim;
  requirements: OutstandingRequirement[];
}
```

Action items to display based on claim state:

1. **Outstanding requirements** (if any are unticked):
   - Show each unticked requirement with its label and an action button
   - "Upload ID" → links to /documents
   - "Upload Proof of Address" → links to /documents
   - "Complete Questionnaire" → links to /documents (or a future questionnaire page)
   - "Upload Extra Lender Form" → links to /documents

2. **Offer pending acceptance** (if claim phase is "Offer Received" and status is "Offer Received" not "Offer Accepted"):
   - Prominent card: "An offer of £{amount} has been received. Please review and accept or decline."
   - "Review Offer" button (primary) — will link to the offer acceptance flow (Phase 4.1, for now just show a toast: "Offer acceptance coming soon")

3. **No actions needed**:
   - If no requirements are outstanding and no offer is pending: show a subtle message "No actions needed right now. We will notify you when there is an update."
   - Use a CheckCircle icon in brand-primary colour

Layout:
- Section heading: "Action Required" (or "All Up to Date" if no actions)
- Each action item as a row/card with icon, description, and action button
- Amber/yellow left border on items requiring attention
- Green left border on the "all clear" message

## Task 5: Claim Detail Page

Route: /claims/:id
File: Update `src/pages/ClaimDetail.tsx` (replace the placeholder)

Data fetching:
- Extract the claim ID from the URL params (useParams from react-router-dom)
- Fetch claim data using fetchClaimById(id) via the useFetch hook
- Fetch requirements using fetchRequirements() via the useFetch hook
- Both calls happen in parallel on mount

### 5a. Loading State
- Full-page skeleton matching the layout below:
  - Skeleton bar for the header
  - Skeleton stepper (8 circles with lines)
  - Skeleton text block for status message
  - Skeleton cards for timeline events
- aria-busy="true"

### 5b. Error State
- If claim ID is not found or API fails:
  - "Claim Not Found" heading
  - "We could not find a claim with ID {id}. It may have been removed or you may not have access."
  - "Back to Dashboard" button → /dashboard
  - If it is a network error (not a 404): show "Something went wrong" with a retry button

### 5c. Page Header
- Back button: "← Back to Dashboard" link at the very top (ArrowLeft icon + text), navigates to /dashboard
- Claim header row:
  - Left: Lender name in font-size-2xl, bold
  - Right: Claim ID in font-size-sm, text-muted (e.g. "RR-676687-554/01")
  - Below lender name: Status badge (using Badge component with correct variant)
  - On mobile: stack vertically

### 5d. Progress Stepper Section
- Full-width ProgressStepper component showing the current phase highlighted
- Padding above and below: 24px
- Subtle background card or section divider above and below

### 5e. Status Message Section
- Card with the client-facing message from statusMapping
- Icon relevant to the current phase on the left
- Message text in font-size-lg, text-primary
- If the claim is in "Getting Started" phase: append "Please check the action items below."
- If the claim has an offer: append "Please review the offer details in the financial summary."

### 5f. Timeline Section
- Section heading: "Claim Timeline" with a Clock icon
- Timeline component showing the claim's events
- Default to showing 5 most recent, expandable

### 5g. Financial Summary Section
- Section heading: "Financial Summary" (only rendered if phase is Offer Received or later)
- FinancialSummary component with the claim's financial data
- Completely hidden for claims before the offer phase

### 5h. Action Items Section
- Section heading: "Action Items"
- ActionItems component

### Page Layout Order (top to bottom):
1. Back button
2. Claim header (lender name, claim ID, badge)
3. Progress stepper
4. Status message card
5. Action items (if any — position these prominently before timeline)
6. Financial summary (if applicable)
7. Timeline

On mobile, all sections stack vertically with 16px gaps.

## Task 6: Update Dashboard Card Links

Ensure that clicking a claim card on the Dashboard navigates to `/claims/{claimId}` where claimId is the full ID (e.g. "RR-676687-554/01"). The claim detail page should extract this from useParams and use it to fetch the correct claim.

Handle the forward slash in the claim ID:
- URL will be: /claims/RR-676687-554/01
- This means the route pattern needs to handle the slash in the ID
- Option A: Encode the ID in the URL (replace / with a dash or encode as %2F)
- Option B: Use a catch-all route pattern like /claims/:clientId/:claimNum
- Choose whichever approach is cleaner — document the decision

## Task 7: Expand Mock Data for Testing

Update the mock data in `src/api/mocks/data.ts` to ensure each of the 4 test claims has rich enough data to fully test the claim detail page:

**Claim 1 — Vanquis (Getting Started):**
- Timeline: 3 events
- Financials: null
- Tests: progress stepper at step 1, no financial section, action items showing outstanding requirements

**Claim 2 — MoneyBoat (Investigation):**
- Timeline: 5 events
- Financials: null
- Tests: progress stepper at step 2, no financial section, no action items (requirements are client-level not claim-level, but still show if unticked)

**Claim 3 — NewDay (Claim In Progress):**
- Timeline: 8 events (enough to test the "show more" expand)
- Financials: null
- Tests: progress stepper at step 3, timeline truncation and expand

**Claim 4 — Zopa (Offer Received):**
- Timeline: 12 events
- Financials: { offerAmount: 2450.00, others null }
- Tests: progress stepper at step 5, financial summary showing offer amount only, action item for offer acceptance

Optionally add 2 more claims to the mock data to test later phases:

**Claim 5 — Gain Credit (Completed / Client Paid):**
- id: "RR-676687-554/05"
- lenderName: "Gain Credit"
- internalStatus: "Client Paid"
- clientPhase: "Completed"
- Timeline: 15 events (full lifecycle)
- Financials: { offerAmount: 1800.00, grossSettlement: 1800.00, feePercentage: 25, feeAmount: 450.00, netToClient: 1350.00, paymentDate: "2026-05-15" }
- Tests: full financial breakdown, all stepper steps completed

**Claim 6 — APFIN (Closed):**
- id: "RR-676687-554/06"
- lenderName: "APFIN"
- internalStatus: "Claim Closed"
- clientPhase: "Closed"
- Timeline: 6 events
- Financials: null
- Tests: closed state on stepper, no actions

Update the dashboard to show all 6 claims if you add these.

</tasks>

<currency_formatting>
Create a `formatCurrency.ts` utility in `src/utils/`:

```typescript
// Formats a number as GBP currency: £2,450.00
function formatCurrency(amount: number): string

// Formats a percentage: 25%
function formatPercentage(value: number): string
```

Use Intl.NumberFormat with locale "en-GB" and currency "GBP" for consistent formatting. Ensure the pound sign (£) is always present.
</currency_formatting>

<accessibility_requirements>
- Back button: aria-label="Back to dashboard"
- Claim header: proper heading hierarchy (h1 for lender name on this page)
- Progress stepper: role="navigation", aria-label="Claim progress", aria-current="step" on current
- Status message card: role="status" so screen readers announce it
- Timeline: ordered list semantics (ol) with aria-label="Claim timeline"
- Timeline expand button: aria-expanded="true/false"
- Financial summary: use description list (dl/dt/dd) for label-value pairs, proper currency aria-labels
- Action items with pending actions: role="alert" on the section
- All currency values readable by screen readers (£2,450.00 reads naturally)
- Claim not found error: role="alert"
- Loading state: aria-busy="true", aria-label="Loading claim details"
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   └── mocks/
│       └── data.ts                    (updated with richer timeline data + optional 2 new claims)
├── components/
│   └── ui/
│       ├── ProgressStepper.tsx        (new)
│       ├── Timeline.tsx               (new)
│       ├── FinancialSummary.tsx       (new)
│       └── ActionItems.tsx            (new)
├── pages/
│   ├── ClaimDetail.tsx                (updated from placeholder)
│   └── Dashboard.tsx                  (minor update if adding 2 new claims)
├── utils/
│   └── formatCurrency.ts             (new)
└── App.tsx                            (updated route pattern if needed for claim ID handling)
```
</files_expected>

<test_scenarios>
After building, manually test with each of the mock claims:

**Claim 1 — Vanquis (Getting Started):**
1. Click Vanquis card on dashboard → claim detail loads
2. Progress stepper shows step 1 highlighted, steps 2–8 greyed out
3. Status message: "We need some documents from you to proceed..."
4. No financial summary section visible
5. Action items show outstanding requirements (ID Verification, Proof of Address)
6. Timeline shows 3 events, no "show more" button needed

**Claim 2 — MoneyBoat (Investigation):**
7. Progress stepper shows step 1 completed (checkmark), step 2 highlighted
8. Status message: "We have requested your lending records..."
9. No financial summary
10. Timeline shows 5 events, all visible (at the maxVisible limit)

**Claim 3 — NewDay (Claim In Progress):**
11. Progress stepper shows steps 1–2 completed, step 3 highlighted
12. Timeline shows 5 of 8 events, "Show earlier events" button visible
13. Click "Show earlier events" → all 8 events visible, button changes to "Show fewer"

**Claim 4 — Zopa (Offer Received):**
14. Progress stepper shows steps 1–4 completed, step 5 highlighted
15. Financial summary visible showing offer amount: £2,450.00
16. No fee or net amount shown yet (still at offer stage)
17. Action item: "Review Offer" prompt with button

**Claim 5 — Gain Credit (Completed) — if added:**
18. Progress stepper shows steps 1–7 all completed
19. Financial summary shows full breakdown: £1,800.00 gross, 25% fee, £450.00 fee, £1,350.00 net, payment date
20. Action items: "All up to date" message

**Claim 6 — APFIN (Closed) — if added:**
21. Progress stepper shows "Closed" state with grey styling
22. No financial summary
23. Status message about claim being closed

**Navigation:**
24. Back button navigates to /dashboard
25. Browser back button from claim detail returns to dashboard
26. Direct URL /claims/RR-676687-554/01 loads the correct claim
27. Invalid claim ID shows "Claim Not Found" error page

**Responsive:**
28. Desktop: horizontal stepper, timeline and financials side by side or stacked
29. Mobile (375px): vertical stepper (compact mode), all sections stacked
30. Tablet: horizontal stepper with tooltips instead of labels

**Theming:**
31. Dark theme: stepper circles, timeline line, and financial card all visible
32. High contrast: stepper has sufficient contrast, currency values readable
33. Extra Large font: all content scales, stepper circles grow appropriately
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Clicking a claim card on dashboard navigates to the correct claim detail page
- [ ] Claim header shows lender name, claim ID, and status badge
- [ ] Progress stepper correctly shows completed, current, and future phases
- [ ] Stepper switches to vertical layout on mobile
- [ ] Mobile stepper shows compact mode with expand option
- [ ] Status message matches the statusMapping output for the claim's internal status
- [ ] Timeline renders events in reverse chronological order with correct icons and colours
- [ ] Timeline "show more" toggle works with smooth animation
- [ ] Financial summary is completely hidden for claims before Offer Received
- [ ] Financial summary shows only offer amount for Offer Received phase
- [ ] Financial summary shows full breakdown for Completed/Client Paid phase
- [ ] Currency values formatted correctly as £X,XXX.XX
- [ ] Action items show outstanding requirements when unticked
- [ ] Action items show offer review prompt when offer is pending
- [ ] Action items show "all clear" message when nothing is needed
- [ ] Back button navigates to dashboard
- [ ] Invalid claim ID shows proper error page
- [ ] Loading state shows appropriate skeletons
- [ ] All 3 themes render correctly
- [ ] All 3 font sizes scale correctly
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] All accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 2.1 will build the Documents page — document upload with drag-and-drop, file type/size validation, upload progress, outstanding requirements tracking, and the uploaded documents list. It will reuse the requirements data and connect to the existing mock API layer.
</notes_for_next_phase>

## Build notes — what actually happened (status: done, 2026-05-27)

This numbered spec is a **generic template** and does not match the live "Modern Jurist" build. The claim detail page already existed when this phase ran; work was a **targeted gap-fill** (Brad's standing "adapt over literal" decision), not a rebuild. Naming/data-model differences from the spec:

- Data model lives in `src/data/` (not `src/api/mocks/data.ts`): `Claim`/`TimelineEntry`/`Financials` in `types.ts`; `ClaimPhase` derived from `internalStatus` via `phaseOf()`/`clientMessage()` in `statusMap.ts` (no `clientPhase` field). Fees computed at runtime by `computeFee()` + progressive `financialVisibility()` in `financials.ts`. Icons are **Material Symbols** via `<Icon>`, not lucide-react. Currency is `gbp()` in `lib/format.ts` (spec's `formatCurrency.ts` was not created).
- Route `/claims/:id` → `routes/ClaimDetail.tsx` already wired; dashboard cards already `<Link>` with `encodeURIComponent` (slash in IDs handled). 8 mock claims already cover all 8 phases — the spec's Zopa/Gain Credit/APFIN were **not** added (equivalents exist: `/14` Lending Stream Completed-escalated, `/05` Cashfloat Closed).
- Existing components (already present, unchanged): `PhaseProgressTracker` (= spec "ProgressStepper": vertical mobile / horizontal desktop, 7-step base / 8-step escalated), `FinancialSummary` (progressive reveal), `OfferAcceptance` (typed-name accept form — replaces the spec's toast stub), `WhatHappensNext`.

What this phase actually added/changed:
- **`components/claim/ActionItems.tsx`** (new) — claim-scoped to-do list. Decision: **all** client requirements shown on every *active* claim (mirrors the dashboard "What We Need" card); Closed/Completed claims show an "All up to date" reassurance (never list document requirements). Offer-pending claims get a nudge with a "Review offer" button that scrolls to + focuses `#offer-acceptance`. `role="alert"` when actions pending. Inserted as the first item in the ClaimDetail main column.
- **`components/claim/Timeline.tsx`** — added `maxVisible` (default 5) + "Show earlier events / Show fewer events" toggle (`aria-expanded`, framer-motion height/opacity, reduced-motion aware); converted to `<ol>`/`<li>`; empty state.
- **`routes/ClaimDetail.tsx`** — parallel `useMockQuery(getRequirements)`; renders `ActionItems`; `role="status"` on status card; `aria-label="Back to dashboard"`; `#offer-acceptance` wrapper.
- **`data/mock.ts`** — added `getRequirements()`; enriched NewDay `/31` timeline 5→8 events so the Timeline toggle is demonstrable.
- **`lib/format.ts`** — added `formatPercentage()`; used in `FinancialSummary` fee label.

Verified: `tsc --noEmit` clean; dev server clean (no console errors/warnings); all 8 claims + not-found tested via Chrome DevTools (mobile vertical stepper + desktop horizontal stepper/sidebar); offer nudge scroll/focus works; full fee breakdown correct (£6,400 → 28%+VAT capped → −£2,150.40 → £4,249.60 net).
