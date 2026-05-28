# Rowan Rose Client Portal — Phase 1.5: Dashboard Page

<context>
Phases 1.1 (design system), 1.2 (layout shell, navigation, routing), 1.3 (registration flow, AuthLayout, mock API layer, toast system, validation utilities), and 1.4 (login, logout, password reset, AuthContext, session management, protected routes, inactivity timer) are all complete. The app has a fully working auth system with mock APIs, session management, and route protection.

This is Phase 1.5. You are building the Dashboard — the first page clients see after logging in. It provides a summary of all their claims at a glance, highlights outstanding requirements, and offers quick actions. The dashboard must feel informative but not overwhelming, especially for older clients (up to age 70).

All API calls continue to be MOCKED. The mock data should be realistic and cover multiple scenarios to properly test the dashboard layout.
</context>

<tasks>

## Task 1: Mock Data — Claims & Requirements

Create comprehensive mock data files that simulate a real client's account. These will be used by the dashboard and later by the Claim Detail page (Phase 1.6).

Create `src/api/mocks/data.ts`:

```typescript
// Mock client has 4 claims at different stages to test all badge colours and states

interface Claim {
  id: string;                    // e.g. "RR-676687-554/01"
  clientId: string;              // e.g. "RR-676687-554"
  lenderName: string;
  internalStatus: string;
  clientPhase: string;           // Mapped from internal status
  clientMessage: string;         // Client-friendly message
  lastUpdated: string;           // ISO date string
  createdAt: string;             // ISO date string
  unreadMessages: number;
  timeline: TimelineEvent[];
  financials: ClaimFinancials | null;
}

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'document_uploaded' | 'message_received' | 'message_sent' | 'offer_received' | 'payment';
  title: string;
  description: string;
  date: string;                  // ISO date string
  icon: string;                  // lucide-react icon name
}

interface ClaimFinancials {
  offerAmount: number | null;
  grossSettlement: number | null;
  feePercentage: number | null;
  feeAmount: number | null;
  netToClient: number | null;
  paymentDate: string | null;
}

interface OutstandingRequirement {
  id: string;
  label: string;
  type: 'id_verification' | 'proof_of_address' | 'questionnaire' | 'extra_lender_form';
  status: 'ticked' | 'unticked';
  description: string;
}
```

Mock claims data (4 claims for the test client Sarah Mitchell):

**Claim 1 — Vanquis (Getting Started phase):**
- id: "RR-676687-554/01"
- lenderName: "Vanquis Bank"
- internalStatus: "Documents Required"
- clientPhase: "Getting Started"
- clientMessage: "We need some documents from you to proceed. Please upload the items listed below."
- lastUpdated: 2 days ago from today
- unreadMessages: 1
- Timeline: 3 events (claim created, onboarding complete, documents requested)
- Financials: null (no financial info before offer)

**Claim 2 — MoneyBoat (Investigation phase):**
- id: "RR-676687-554/02"
- lenderName: "MoneyBoat"
- internalStatus: "DSAR Sent"
- clientPhase: "Investigation"
- clientMessage: "We have requested your lending records from the lender. This typically takes 30 days."
- lastUpdated: 5 days ago
- unreadMessages: 0
- Timeline: 5 events (claim created, onboarding, docs uploaded, DSAR prepared, DSAR sent)
- Financials: null

**Claim 3 — NewDay (Claim In Progress phase):**
- id: "RR-676687-554/03"
- lenderName: "NewDay Ltd"
- internalStatus: "Complaint Submitted"
- clientPhase: "Claim In Progress"
- clientMessage: "Your complaint has been submitted to the lender. We are now awaiting their response."
- lastUpdated: 1 day ago
- unreadMessages: 2
- Timeline: 8 events (full progression from creation through DSAR to complaint)
- Financials: null

**Claim 4 — Zopa (Offer Received phase):**
- id: "RR-676687-554/04"
- lenderName: "Zopa"
- internalStatus: "Offer Received"
- clientPhase: "Offer Received"
- clientMessage: "An offer has been received. Please review the details and acceptance form below."
- lastUpdated: today
- unreadMessages: 1
- Timeline: 12 events (full progression to offer)
- Financials: { offerAmount: 2450.00, grossSettlement: null, feePercentage: 25, feeAmount: null, netToClient: null, paymentDate: null }

Mock outstanding requirements:
- ID Verification: unticked
- Proof of Address: unticked
- Questionnaire: ticked
- Extra Lender Form: ticked

(So 2 out of 4 are outstanding, which triggers the requirements banner on the dashboard.)

## Task 2: Mock API Endpoints for Dashboard

Add new mock functions and corresponding API functions for the dashboard data.

Add to `src/api/mocks/claims.ts` (new file):

```typescript
// GET /client/claims — returns all claims for the authenticated client
function getClientClaims(): Promise<Claim[]>
// Simulate 800ms delay
// Return all 4 mock claims

// GET /client/claims/:id — returns detailed claim info
function getClaimById(claimId: string): Promise<Claim>
// Simulate 600ms delay
// Return the matching claim with full timeline

// GET /client/requirements — returns outstanding requirements
function getClientRequirements(): Promise<OutstandingRequirement[]>
// Simulate 500ms delay
// Return all 4 requirements with their ticked/unticked status
```

Add to `src/api/claims.ts` (new file):
- Export functions: `fetchClaims()`, `fetchClaimById(id)`, `fetchRequirements()`
- These call the mocks for now (same pattern as auth.ts)

## Task 3: Status Mapping Utility

Create `src/utils/statusMapping.ts` that maps internal CRM statuses to client-facing phases and messages. This is a critical piece of logic used across the dashboard and claim detail pages.

```typescript
interface StatusMapping {
  phase: string;
  message: string;
  badgeVariant: string;   // Maps to Badge component variants from Phase 1.1
}

function mapStatus(internalStatus: string): StatusMapping
```

Complete mapping table (from the original spec):

| Internal Status | Phase | Badge Variant |
|----------------|-------|---------------|
| Onboarding | Getting Started | getting-started |
| Documents Required | Getting Started | getting-started |
| Awaiting Bank Statements | Getting Started | getting-started |
| DSAR Sent | Investigation | investigation |
| DSAR Received | Investigation | investigation |
| DSAR Chased | Investigation | investigation |
| Complaint Submitted | Claim In Progress | in-progress |
| Complaint Chased | Claim In Progress | in-progress |
| FRL Received | Claim In Progress | in-progress |
| Counter Response Sent | Claim In Progress | in-progress |
| FOS Submitted | Escalated to Ombudsman | escalated |
| FOS Chased | Escalated to Ombudsman | escalated |
| FOS Awaiting Decision | Escalated to Ombudsman | escalated |
| Offer Received | Offer Received | offer |
| Offer Accepted | Offer Received | offer |
| Offer Rejected | Offer Received | offer |
| Payment Received | Settlement | settlement |
| Fee Deducted | Settlement | settlement |
| Client Paid | Completed | completed |
| Claim Closed | Closed | closed |

Hidden statuses (should NEVER appear on the portal):
- New Lead
- Contact Attempted
- Not Qualified
- Sale
- Counter Team
- Weak Case Cannot Continue

If a hidden status is encountered, return a generic "Processing" phase with text-muted badge. Log a warning to the console.

Also export a helper:
```typescript
function getPhaseOrder(phase: string): number
// Returns the numeric order of a phase for sorting and progress tracking
// Getting Started = 1, Investigation = 2, Claim In Progress = 3,
// Escalated to Ombudsman = 4, Offer Received = 5, Settlement = 6,
// Completed = 7, Closed = 8
```

## Task 4: Dashboard Page

Route: /dashboard
File: Update `src/pages/Dashboard.tsx` (replace the placeholder)

The dashboard fetches data on mount and displays it. Use React state for loading, error, and data states.

### 4a. Loading State

While API calls are in progress:
- Show skeleton placeholders that match the shape of the final content
- Skeleton for welcome banner: grey animated pulse bar (full width, 48px height)
- Skeleton for requirements banner: grey pulse bar (full width, 80px height)
- Skeleton for claim cards: 4 grey pulse card shapes in the grid
- Use a subtle pulse/shimmer animation on skeletons
- Accessible: aria-busy="true" on the main content area, aria-label="Loading your dashboard"

### 4b. Welcome Banner

- Full-width card at the top of the dashboard
- Left side: "Welcome back, {firstName}" in font-size-2xl, bold
- Below the name: today's date formatted as "Wednesday, 28 May 2026" (UK date format, no ordinal suffix)
- Right side (desktop): a subtle decorative element or the Rowan Rose logo mark
- Background: subtle gradient using brand-primary at very low opacity (5-10%) or just var(--bg-secondary)
- On mobile: stack vertically, hide decorative element

### 4c. Outstanding Requirements Banner

Only shown if there are any unticked requirements. If all requirements are ticked, this section is completely hidden.

- Amber/yellow alert card below the welcome banner
- Left icon: AlertTriangle from lucide-react in amber colour
- Heading: "Action Required" in bold
- Message: "Please complete the following to proceed with your claims:" in text-secondary
- List of unticked requirements, each as a row showing:
  - Requirement label (e.g. "ID Verification")
  - Brief description (e.g. "Upload a photo of your passport, driving licence, or national ID card")
  - Action button: "Upload" or "Complete" (links to /documents page)
- The banner should feel prominent but not alarming — amber/warm colour, not red
- Accessible: role="alert" so screen readers announce it on page load
- Dismiss button (X): hides the banner for the current session (stores in sessionStorage), reappears on next login

### 4d. Offer Alert Banner

If any claim has the status "Offer Received", show a special green alert banner:
- Green background (brand-primary at low opacity or status-offer colour)
- Icon: Gift or DollarSign from lucide-react
- Message: "An offer has been received for your claim against {lenderName}. Review and respond now."
- Action button: "Review Offer" — links to /claims/{claimId}
- If multiple claims have offers, show one banner per claim (stacked)
- This banner cannot be dismissed (offers require action)

### 4e. Claims Summary Cards

Grid of cards, one per claim. This is the main content area of the dashboard.

Grid layout:
- Desktop (1024px+): 2 columns
- Tablet (768px–1023px): 2 columns
- Mobile (below 768px): 1 column (stacked)
- Gap: 16px between cards

Each claim card contains:
- **Lender name** — bold, font-size-lg, text-primary colour
- **Claim ID** — font-size-sm, text-muted colour (e.g. "RR-676687-554/01")
- **Status badge** — using the Badge component from Phase 1.1 with the correct variant from statusMapping. Shows the client-facing phase name (e.g. "Getting Started", "Investigation")
- **Client message** — font-size-sm, text-secondary, truncated to 2 lines with ellipsis if longer
- **Last updated** — font-size-xs, text-muted, relative time format: "Updated 2 days ago", "Updated today", "Updated 5 days ago". Use a utility function to calculate relative time
- **Unread messages indicator** — if unreadMessages > 0, show a small badge: "{count} new message(s)" with a MessageSquare icon, in brand-primary colour
- **Arrow icon** — ChevronRight from lucide-react on the right edge, text-muted, indicating the card is clickable

Card behaviour:
- Entire card is clickable (navigates to /claims/{claimId})
- Hover state: subtle shadow increase or border colour change
- Cursor: pointer
- Focus state: visible focus ring (keyboard navigation)
- The card should use the Card component from Phase 1.1 as a base

Card sorting:
- Claims with offers should appear first (highest priority for client action)
- Then sort by lastUpdated date (most recent first)

### 4f. Empty State

If the client has no claims (edge case but handle it):
- Centred message with a FileText icon
- Heading: "No Claims Yet"
- Message: "You do not have any active claims at the moment. If you believe this is an error, please contact us."
- Contact link: "Get in touch" linking to mailto:support@rowanrose.co.uk

### 4g. Error State

If the API calls fail (simulate by temporarily breaking a mock):
- Centred error message with an AlertCircle icon in red
- Heading: "Something Went Wrong"
- Message: "We could not load your dashboard. Please try again."
- Retry button: "Try Again" (primary Button) — re-triggers the data fetch
- Below: "If the problem persists, please contact us at support@rowanrose.co.uk"

### 4h. Notification Count

Update the notification bell in the Header (from Phase 1.2) with real data:
- Sum up all unreadMessages across all claims
- Display that total as the badge count on the bell icon
- If count is 0, hide the badge entirely
- Pass this data from the dashboard to the Header via AuthContext or a separate NotificationContext, OR use a simple prop/callback pattern

### 4i. Quick Action Buttons

Below the claims grid (or above on mobile), show two quick action buttons side by side:
- "Upload Document" (Upload icon) — links to /documents
- "View Messages" (MessageSquare icon) — links to /messages
- Styled as secondary buttons or outlined cards with icon + label
- On mobile: stack vertically, full width

## Task 5: Relative Time Utility

Create `src/utils/formatDate.ts`:

```typescript
// Returns relative time string: "today", "yesterday", "2 days ago", "1 week ago", etc.
function formatRelativeTime(dateString: string): string

// Returns formatted UK date: "28 May 2026"
function formatUKDate(dateString: string): string

// Returns formatted UK date with day: "Wednesday, 28 May 2026"
function formatUKDateFull(dateString: string): string

// Returns formatted time: "14:32"
function formatTime(dateString: string): string

// Returns formatted date and time: "28 May 2026 at 14:32"
function formatDateTime(dateString: string): string
```

Rules for relative time:
- Less than 1 minute ago: "just now"
- Less than 1 hour ago: "X minutes ago"
- Less than 24 hours ago: "X hours ago"
- Yesterday: "yesterday"
- Less than 7 days ago: "X days ago"
- Less than 30 days ago: "X weeks ago"
- Otherwise: formatted date (e.g. "28 May 2026")

## Task 6: Skeleton Loading Components

Create reusable skeleton components in `src/components/ui/Skeleton.tsx`:

```typescript
// Base skeleton with pulse animation
Skeleton({ width, height, borderRadius, className })

// Pre-built skeleton shapes
SkeletonText({ lines, width })        // Multiple lines of text
SkeletonCard({ height })              // Card-shaped skeleton
SkeletonBanner({ height })            // Full-width banner skeleton
SkeletonCircle({ size })              // Circular skeleton (for avatars/icons)
```

Skeleton styling:
- Background: var(--bg-tertiary) as base
- Animated shimmer: a lighter shade sweeps across left to right, repeating
- Border-radius matches the element it represents
- Respects current theme (darker shimmer in dark/high-contrast themes)

## Task 7: Custom Hook for Data Fetching

Create `src/hooks/useFetch.ts` — a reusable hook for API data fetching with loading, error, and data states:

```typescript
interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(fetchFn: () => Promise<T>, deps?: any[]): UseFetchResult<T>
```

Behaviour:
- Calls fetchFn on mount and when deps change
- Manages loading/error/data states
- refetch() allows manual re-triggering (used by the "Try Again" button on error state)
- Cleans up on unmount (avoids setting state on unmounted component)
- Generic typed so it works with any API response

Use this hook in the Dashboard to fetch claims and requirements data.

</tasks>

<accessibility_requirements>
- Dashboard main content area: aria-label="Dashboard"
- Loading state: aria-busy="true" on content area
- Outstanding requirements banner: role="alert"
- Offer alert banner: role="alert"
- Claim cards: each card is a focusable link with aria-label describing the claim (e.g. "Vanquis Bank claim RR-676687-554/01, Getting Started, updated 2 days ago")
- Skeleton loaders: aria-hidden="true" (they are decorative while loading)
- Quick action buttons: proper aria-labels
- Error state retry button: focus moves to it after error appears
- Notification badge: aria-label with count (e.g. "4 unread notifications")
- All relative times: use a <time> element with the full datetime attribute for screen readers
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── claims.ts                  (new — claims API functions)
│   └── mocks/
│       ├── auth.ts                (unchanged)
│       ├── claims.ts              (new — mock claims/requirements)
│       └── data.ts                (new — mock data definitions)
├── components/
│   └── ui/
│       └── Skeleton.tsx           (new — skeleton loading components)
├── hooks/
│   └── useFetch.ts                (new — reusable data fetching hook)
├── pages/
│   └── Dashboard.tsx              (updated from placeholder)
├── utils/
│   ├── formatDate.ts              (new — date formatting utilities)
│   ├── statusMapping.ts           (new — internal to client status mapping)
│   └── validation.ts              (unchanged)
└── App.tsx                        (unchanged)
```
</files_expected>

<test_scenarios>
After building, manually test these scenarios:

**Data Loading:**
1. Log in → dashboard shows skeleton loaders briefly → real content appears
2. Welcome banner shows "Welcome back, Sarah" and today's date in UK format
3. All 4 claim cards render with correct lender names, claim IDs, badges, and messages
4. Claims are sorted: Zopa (Offer Received) first, then NewDay, Vanquis, MoneyBoat by last updated

**Requirements Banner:**
5. Outstanding requirements banner shows with 2 items (ID Verification, Proof of Address)
6. Clicking "Upload" on a requirement navigates to /documents
7. Dismissing the banner hides it for the session
8. Refreshing the page after dismiss → banner stays hidden
9. Logging out and back in → banner reappears

**Offer Banner:**
10. Green offer banner shows for the Zopa claim
11. Clicking "Review Offer" navigates to /claims/RR-676687-554/04

**Claim Cards:**
12. Clicking the Vanquis card navigates to /claims/RR-676687-554/01
13. Vanquis card shows "Getting Started" badge in blue
14. MoneyBoat card shows "Investigation" badge in purple
15. NewDay card shows "Claim In Progress" badge in orange
16. Zopa card shows "Offer Received" badge in green
17. NewDay card shows "2 new messages" indicator
18. Cards show correct relative time ("Updated today", "Updated 2 days ago", etc.)

**Notification Badge:**
19. Header bell icon shows total unread count (1 + 0 + 2 + 1 = 4)
20. If all unreadMessages were 0, badge would be hidden

**Quick Actions:**
21. "Upload Document" button navigates to /documents
22. "View Messages" button navigates to /messages

**Error State:**
23. Temporarily break a mock → dashboard shows error state with retry button
24. Click "Try Again" → data fetches successfully

**Responsive:**
25. Desktop (1024px+): 2-column card grid, sidebar visible
26. Tablet (768px): 2-column grid, collapsed sidebar
27. Mobile (375px): single-column stacked cards, bottom tab bar
28. Welcome banner stacks vertically on mobile

**Theming:**
29. Switch to Dark theme → all dashboard elements styled correctly, badges visible
30. Switch to High Contrast → all text readable, badges have sufficient contrast
31. Switch to Extra Large font → all text scales, cards expand to fit content, no overflow
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Dashboard loads with skeleton placeholders then displays real data
- [ ] Welcome banner shows authenticated user's first name and today's UK-formatted date
- [ ] Outstanding requirements banner shows only unticked items
- [ ] Requirements banner can be dismissed for the current session
- [ ] Offer alert banner shows for claims in "Offer Received" status
- [ ] All 4 claim cards render with correct data, badges, and relative timestamps
- [ ] Claims sorted by priority (offers first, then most recently updated)
- [ ] Clicking a claim card navigates to the correct claim detail route
- [ ] Unread message indicators show on cards with unread messages
- [ ] Header notification badge shows correct total unread count
- [ ] Quick action buttons navigate to correct pages
- [ ] Empty state renders if no claims exist
- [ ] Error state renders with retry button if API calls fail
- [ ] Skeleton components have smooth pulse animation
- [ ] useFetch hook handles loading, error, data, and refetch correctly
- [ ] statusMapping correctly maps all internal statuses to phases and badge variants
- [ ] formatDate utilities produce correct UK-formatted dates and relative times
- [ ] All 3 themes render the dashboard correctly
- [ ] All 3 font sizes scale the dashboard correctly
- [ ] Responsive at 375px, 768px, 1024px+ viewports
- [ ] All accessibility requirements met (ARIA labels, roles, keyboard nav)
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 1.6 will build the Claim Detail page — the full view when a client clicks on a claim card. It will use the same mock data and statusMapping utility created in this phase. The detail page includes the progress stepper, status message, event timeline, conditional financial summary, and action items.
</notes_for_next_phase>

---

## Build Notes (2026-05-27) — status: done

This spec is a generic template. The Modern Jurist build was already past it: the Dashboard
([`routes/Dashboard.tsx`](../../../frontend/app/src/routes/Dashboard.tsx)) was fully built, and
nearly every "new file" listed already existed under different names. Per Brad's standing
"adapt over literal" decision, the spec's **intent** was mapped onto the existing build rather
than implemented verbatim. No `src/api/` or `src/utils/` parallel files; no lucide-react; no
`Badge`. Reused: `data/mock.ts`, `data/useMockQuery.ts`, `data/statusMap.ts` +
`data/phaseTracker.ts` + `StatusPill`, `lib/format.ts`, `ui/Skeleton.tsx`, `ui/EmptyState.tsx`.

**What shipped:**
- **Mock data** — extended Sarah Holden to **8 claims** so every `ClaimPhase`/`StatusPill`
  state renders (added QuidMarket/Getting Started, NewDay/In Progress, Lendable/Escalated,
  Moneyboat/Settlement, Cashfloat/Closed). Added optional `unreadMessages` to the `Claim` type;
  `getUnreadCount()` sums them (bell total = **5**).
- **Dynamic notification bell** — new `context/NotificationContext.tsx` replaces the hardcoded
  `3` in both `SideNav` and the mobile `BellButton`; badge hides at 0.
- **Error + retry** — `useMockQuery` now exposes `error` + `refetch` (non-breaking); Dashboard
  renders an `EmptyState` error surface with a focused "Try Again" button.
- **Empty-state guard** — `EmptyState` shown if a client has no claims.
- **Offer banner** — `dashboard/OfferBanner.tsx` (role="alert", non-dismissible), one per
  offer claim, above the grid.
- **Quick actions** — `dashboard/QuickActions.tsx` (Upload Document → /documents, View
  Messages → **/chat** — the real route; spec's `/messages` doesn't exist here).
- **Full UK date** — `formatUKDateFull()` added to `lib/format.ts`; shown in the desktop
  welcome header and the mobile header subtitle.
- **Sort** — offers first, then most-recently updated.

**Deliberately not done:** dismissible requirements banner (violates Critical UX Rule #1 —
`WhatWeNeedCard` stays sacred/non-dismissible); hidden-status "Processing" fallback
(`InternalStatus` is a closed union, so unrepresentable — would be dead code).

**Verification:** `tsc -b` and full `vite build` pass clean. In-browser walkthrough via the
chrome-devtools MCP was blocked (browser already running on its profile — needs a fresh chat);
dev server serves at `http://localhost:5174/`. Test login: `client@test.com` / `Password1`.
