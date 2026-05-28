---
phase: 3.1
area: Frontend
title: Messages / chat page
status: done
depends_on: 2.1
---

# Rowan Rose Client Portal — Phase 3.1: Messages Page

## Build notes

Delivered 2026-05-28. The spec was a generic template; the build adapts it to the existing "Modern Jurist" frontend.

**Adaptations from the spec:**
- Route stays `/chat` (and `/chat/:claimId`), not `/messages` — Brad's standing decision to keep `/chat`. The placeholder at `frontend/app/src/routes/Chat.tsx` was rewritten in place.
- Components live in `frontend/app/src/components/chat/`, not `messages/`.
- Client name is **Sarah Holden** (matches the existing mock client), not "Sarah Mitchell" from the spec.
- 4 active threads cover the 4 claims with `unreadMessages > 0` (total 5 unread, matching the SideNav bell driven by `getUnreadCount()`):
  - Vanquis `/21` (DSAR Sent) — 4 msgs, 1 unread, Emma chasing ID/POA
  - NewDay (Aqua) `/31` (Complaint Submitted) — 6 msgs, 2 unread, lender extension update
  - 118 118 Money `/09` (Offer Received) — 3 msgs, 1 unread, James recommending the £3,480 offer (replaces spec's Zopa, which isn't in the firm's lender list)
  - QuidMarket `/28` (Documents Required) — 3 msgs, 1 unread, James chasing bank statement (new, beyond spec's 3 threads)
- Other 4 claims show "No messages yet"; `getMessageThreads()` synthesises empty threads for them so every claim appears in the selector.
- Tokens use the actual `--c-*` CSS variables (Tailwind utilities `bg-surface-container`, `text-on-surface`, `border-outline-variant`, etc.), not the spec's generic `var(--bg-secondary)`.
- Icons are Material Symbols via the existing `Icon` component, not lucide-react.
- Task 8 (typing indicator) skipped — out of scope.

**New surface area:**
- `frontend/app/src/api/messages.ts` + `frontend/app/src/api/mocks/messages.ts` — surface + in-memory store mirroring the documents pattern.
- 8 new components under `frontend/app/src/components/chat/`: ThreadSelector, ThreadCard, ChatHeader, MessageThread, MessageBubble, ReplyComposer, DateSeparator, UnreadDivider.

**Cross-cutting changes:**
- `NotificationContext` now uses `useSyncExternalStore` so mark-as-read mutations to `Claim.unreadMessages` propagate to the SideNav bell, the BottomTabBar Chat badge, the SideNav Chat row badge, and the dashboard `ClaimSummaryCard` "N new" pill — all from one source.
- `data/mock.ts` exposes `subscribeUnread` / `notifyUnread` to back that.
- `ClaimSummaryCard` got a small "N new" message pill in the lender-header row that navigates to `/chat/:claimId` (with `stopPropagation` so the surrounding claim-detail Link doesn't fire).
- `navItems.ts` got an optional `badgeKey: "unread"` flag; SideNav + BottomTabBar render the badge when set.
- `App.tsx`'s `AnimatePresence` key collapses `/chat/*` to a single section so navigating between threads doesn't unmount the page (and replay the 700ms thread-list fetch every time).
- `MobileHeader` back variant now accepts an optional `onBack` handler so the chat detail's back action goes to `/chat` reliably, even after a direct URL load.
- `lib/format.ts` gained `formatDateTime`, `formatTime`, and `formatRelativeDay` helpers.

**Verified manually (Chrome DevTools at 1280×820 and 375×812, dark theme):**
- Thread sort order (unread desc → last-message desc → empty last).
- Chat shows date separators, message grouping, dual firm senders with initials avatars.
- Send flow: optimistic insert → real message replacement, input clears, scroll snaps to bottom.
- Mark-as-read fires 2s after thread open (or immediately if scrolled to bottom); SideNav bell, selector pills, and per-claim card badges all update in sync.
- Mobile two-view navigation with slide transition; back arrow returns to `/chat`.
- Empty thread shows lender-specific "No messages yet" copy.
- `npm run build` (tsc + vite) passes; no console warnings or errors at runtime.

**Known gaps:**
- Task 8 typing indicator deliberately skipped.
- Failure/retry flow exists but only reachable by setting `localStorage.mockFailSend = "1"` — that's the intended way to demo it in the mock build.

<context>
Phases 1.1 through 2.1 are complete. The app has a working design system, layout shell, full auth flow, session management, dashboard with claim cards, claim detail view, and documents page with drag-and-drop upload and requirements tracking. Mock data exists for 4–6 claims with timelines and financial data.

This is Phase 3.1. You are building the Messages page where clients can view and reply to message threads associated with each of their claims. Messages are organised per-claim — each claim has its own conversation thread between the client and the firm. The interface uses a chat-style layout that feels familiar and easy to use for clients aged 18–70.

All API calls continue to be MOCKED.
</context>

<tasks>

## Task 1: Mock Data — Messages

Create `src/api/mocks/messages.ts` with realistic mock message data.

```typescript
interface Message {
  id: string;
  claimId: string;
  sender: 'firm' | 'client';
  senderName: string;           // e.g. "James Taylor" (firm) or "Sarah Mitchell" (client)
  senderRole?: string;          // e.g. "Claims Handler" (firm only)
  content: string;
  timestamp: string;            // ISO date string
  read: boolean;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;                  // Placeholder URL
}

interface MessageThread {
  claimId: string;
  lenderName: string;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string;
}
```

Create mock message threads for 3 of the test claims:

**Thread 1 — Vanquis (RR-676687-554/01) — 4 messages, 1 unread:**

Message 1 (firm, 10 days ago, read):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "Welcome to your Vanquis claim. We have received your initial details and are now setting up your case. You will need to upload your ID and proof of address to proceed. Please use the Documents section to submit these."

Message 2 (client, 9 days ago, read):
- Sender: "Sarah Mitchell"
- Content: "Thank you. I have a question about the proof of address — does a mobile phone bill count or does it need to be a utility bill?"

Message 3 (firm, 9 days ago, read):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "A mobile phone bill is acceptable as long as it is dated within the last 3 months and shows your full name and current address. Alternatively, a council tax letter, utility bill, or bank statement would also work."

Message 4 (firm, 2 days ago, unread):
- Sender: "Emma Roberts", Role: "Senior Claims Handler"
- Content: "Hi Sarah, just a quick reminder that we are still waiting for your ID verification document. Once we receive this, we can move your claim forward. Please upload it at your earliest convenience."

**Thread 2 — NewDay (RR-676687-554/03) — 6 messages, 2 unread:**

Message 1 (firm, 20 days ago, read):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "Your complaint against NewDay Ltd has been formally submitted. The lender has up to 8 weeks to respond. We will keep you updated on any developments."

Message 2 (client, 18 days ago, read):
- Sender: "Sarah Mitchell"
- Content: "Thanks for the update. Is there anything I need to do in the meantime?"

Message 3 (firm, 18 days ago, read):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "Nothing required from you at this stage. We will be in touch as soon as we hear back from NewDay. If they do not respond within the timeframe, we will chase them on your behalf."

Message 4 (client, 5 days ago, read):
- Sender: "Sarah Mitchell"
- Content: "It has been a few weeks now. Have you heard anything back from NewDay?"

Message 5 (firm, 3 days ago, unread):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "We chased NewDay earlier this week as they had not responded within the expected timeframe. We have now received an acknowledgement and they have indicated they will provide a full response within the next 10 working days."

Message 6 (firm, 1 day ago, unread):
- Sender: "Emma Roberts", Role: "Senior Claims Handler"
- Content: "Update: NewDay have requested an extension of 2 weeks to review your complaint fully. This is not unusual and we have agreed to the extension. We will follow up if we do not hear back by the deadline."

**Thread 3 — Zopa (RR-676687-554/04) — 3 messages, 1 unread:**

Message 1 (firm, 7 days ago, read):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "Great news — we have received an offer from Zopa regarding your claim. The offer is for £2,450.00. Please log in to the portal to review the full details and accept or decline the offer."

Message 2 (client, 6 days ago, read):
- Sender: "Sarah Mitchell"
- Content: "That is great news! I will review it now. Is this a good offer in your opinion?"

Message 3 (firm, 5 days ago, unread):
- Sender: "James Taylor", Role: "Claims Handler"
- Content: "Based on our review of your lending history with Zopa, this offer represents a fair settlement. It covers the interest and charges on the loans we identified as irresponsibly lent. I would recommend accepting, but the decision is entirely yours. If you have any questions about the breakdown, please let me know."

**MoneyBoat (RR-676687-554/02) — no messages (empty thread).**

Mock API functions:

```typescript
// GET /client/messages — returns all message threads summary
function getMessageThreads(): Promise<MessageThread[]>
// Simulate 700ms delay
// Return threads sorted by lastMessageAt (most recent first)
// Include unread counts

// GET /client/messages/:claimId — returns full message thread for a claim
function getClaimMessages(claimId: string): Promise<Message[]>
// Simulate 500ms delay
// Return all messages for the claim, sorted chronologically (oldest first)

// POST /client/messages/:claimId — send a new message
function sendMessage(claimId: string, content: string): Promise<Message>
// Simulate 1 second delay
// Return the new message object with current timestamp, sender: 'client'

// PUT /client/messages/:claimId/read — mark all messages in thread as read
function markThreadAsRead(claimId: string): Promise<{ success: boolean }>
// Simulate 300ms delay
// Mark all unread messages as read
```

Add corresponding functions to `src/api/messages.ts`.

## Task 2: Thread Selector Panel

The left side of the Messages page shows a list of all claim threads so the client can switch between conversations.

Layout:
- Vertical list of thread cards, one per claim
- Width: 320px on desktop, full-width on mobile (shown as a separate view)
- Background: var(--bg-secondary)
- Right border: 1px solid var(--border)
- Scrollable if many claims

Each thread card:
- Lender name in bold, font-size-base
- Claim ID in font-size-xs, text-muted
- Last message preview: first 60 characters of the most recent message, truncated with ellipsis, font-size-sm, text-secondary
- Relative timestamp of last message: font-size-xs, text-muted (e.g. "2 days ago")
- Unread count badge: if unreadCount > 0, show a small brand-primary circle with white number (same style as notification badges)
- If no messages exist for a claim: show "No messages yet" in text-muted italic

Active thread card:
- Background: brand-primary at 10% opacity
- Left border: 3px solid brand-primary
- Bold lender name

Hover state:
- Background: var(--bg-tertiary)
- Cursor: pointer

Sorting:
- Threads with unread messages appear first
- Then sorted by lastMessageAt (most recent first)
- Claims with no messages appear last

## Task 3: Chat Interface

The right side of the Messages page shows the selected claim's message thread in a chat-style layout.

### 3a. Chat Header

Fixed at the top of the chat area:
- Lender name in bold, font-size-lg
- Claim ID in font-size-xs, text-muted
- Status badge showing current claim phase
- On mobile: include a back arrow (ArrowLeft) to return to the thread selector

### 3b. Message Bubbles

Scrollable area showing the conversation:

**Firm messages (left-aligned):**
- Avatar circle on the left: initials of sender (e.g. "JT" for James Taylor) in brand-primary background with white text, 36px diameter
- Next to avatar:
  - Sender name in bold, font-size-sm + role in font-size-xs, text-muted (e.g. "James Taylor — Claims Handler")
  - Message bubble: var(--bg-secondary) background, rounded corners (12px, with top-left corner less rounded: 4px to connect to the avatar side), padding 12px 16px
  - Message text in font-size-base, text-primary
  - Timestamp below the bubble: font-size-xs, text-muted, formatted as "28 May 2026, 14:32" using formatDateTime utility
- Max width: 75% of the chat area (so bubbles don't span the full width)

**Client messages (right-aligned):**
- No avatar (the client knows who they are)
- Message bubble: brand-primary background with white text, rounded corners (12px, with top-right corner less rounded: 4px)
- Timestamp below the bubble: font-size-xs, text-muted, right-aligned
- Max width: 75%

**Unread divider:**
- When scrolling through messages, if there are unread messages, show a divider line with the text "New messages" centred on the line, in brand-primary colour
- Placed above the first unread message
- Disappears after messages are marked as read (after 3 seconds of the thread being open)

Message grouping:
- If the same sender sends multiple messages within 5 minutes, group them:
  - Only show avatar/name on the first message of the group
  - Subsequent messages in the group have tighter spacing (8px instead of 16px)
  - Only show timestamp on the last message of the group

Date separators:
- Between messages on different days, show a date separator line: "Today", "Yesterday", "18 May 2026"
- Centred text on a subtle divider line, font-size-xs, text-muted

Auto-scroll:
- On initial load: scroll to the bottom (most recent message)
- When a new message is sent: smooth scroll to bottom
- If the user has scrolled up to read older messages: do NOT auto-scroll when new content loads (respect their position). Show a "New message ↓" floating button at the bottom to jump to latest

### 3c. Attachments in Messages

If a message has attachments (optional, for future use):
- Show a small card below the message text for each attachment
- File icon + filename + file size
- Clickable (in future would download the file, for now show a toast "Download coming soon")
- Styled as a subtle card within the message bubble

### 3d. Empty Thread State

If the selected claim has no messages:
- Centred in the chat area
- MessageSquare icon, large, text-muted
- "No messages yet"
- "Your claims handler will contact you here when there are updates about your {lenderName} claim."

## Task 4: Reply Composer

Fixed at the bottom of the chat area, below the message thread.

Layout:
- Background: var(--bg-secondary)
- Top border: 1px solid var(--border)
- Padding: 12px 16px
- Contents in a single row: text input area + send button

Text input:
- Expandable textarea (grows with content, min 1 row, max 5 rows before scrolling)
- Placeholder: "Type your message..."
- Font-size-base
- Background: var(--bg-primary)
- Border: 1px solid var(--border), focus: border-focus
- Rounded corners: 8px
- No resize handle (auto-grows instead)

Character limit:
- Maximum 2000 characters
- Show character count below the input when content exceeds 1500 characters: "{count}/2000" in font-size-xs
- When at 1800+: text colour changes to amber (warning)
- When at 2000: text colour changes to red, input prevents further typing

Send button:
- Circular or rounded button with Send icon (Send from lucide-react)
- Brand-primary background, white icon
- Size: 40px
- Disabled when: input is empty (whitespace-only counts as empty), or message is sending
- Loading state while sending: spinner replaces send icon
- Keyboard shortcut: Enter sends the message (on desktop). Shift+Enter inserts a new line
- On mobile: Enter inserts a new line (mobile keyboards use Enter for line breaks). Send button is the only way to send

On send:
- Call sendMessage mock API
- Optimistic update: add the message to the thread immediately with a "sending" state (slightly faded/italic)
- On API success: update message to "sent" state (normal styling), scroll to bottom
- On API failure: show error indicator on the message ("Failed to send. Tap to retry."), red text, tapping retries the send
- Clear the input field
- Show brief sending animation (the message bubble slides in from bottom-right)

## Task 5: Mark as Read Logic

When a thread is selected and has unread messages:
- Wait 2 seconds (to ensure the client has actually looked at the messages)
- Call markThreadAsRead(claimId) mock API
- On success: update the unread count to 0 in the thread selector
- Update the total unread count in the header notification badge
- Remove the "New messages" divider after marking as read

Edge cases:
- If the client switches threads before 2 seconds: cancel the mark-as-read call for the previous thread
- If the client is already at the bottom of the chat (all messages visible): mark as read immediately
- If the client has scrolled up and hasn't seen the unread messages: do NOT mark as read until they scroll down to see them

## Task 6: Messages Page Assembly

Route: /messages and /messages/:claimId
File: Update `src/pages/Messages.tsx` (replace the placeholder)

### Desktop Layout (1024px+):
```
┌──────────────────────────────────────────────┐
│              Messages (page heading)          │
├───────────────┬──────────────────────────────┤
│               │         Chat Header           │
│  Thread       │──────────────────────────────│
│  Selector     │                               │
│  Panel        │       Message Thread          │
│               │       (scrollable)            │
│  (320px)      │                               │
│               │──────────────────────────────│
│               │       Reply Composer          │
└───────────────┴──────────────────────────────┘
```

- Thread selector panel fixed on the left
- Chat area takes remaining width
- Chat area has its own scroll (not the page scroll)
- Full viewport height minus header and page heading

### Tablet Layout (768px–1023px):
- Same as desktop but thread selector width reduces to 260px

### Mobile Layout (below 768px):
- Two-view navigation:
  - **View 1 (Thread List):** full-width list of thread cards, no chat visible. This is the default view.
  - **View 2 (Chat):** full-width chat interface with back button in header to return to thread list
- Navigating to /messages shows the thread list
- Navigating to /messages/:claimId or tapping a thread card shows the chat view
- Back arrow in chat header returns to thread list
- Smooth transition between views (slide left/right)

### URL Routing:
- /messages → shows thread selector with no thread selected (desktop shows "Select a conversation" placeholder in chat area)
- /messages/:claimId → shows the specific thread selected
- Clicking a thread card updates the URL to /messages/:claimId
- On mobile, /messages shows the list, /messages/:claimId shows the chat

### No Thread Selected State (desktop only):
When on /messages with no thread selected, the chat area shows:
- Centred message
- MessageSquare icon, large, text-muted
- "Select a conversation"
- "Choose a claim from the left to view your messages."

### Loading State:
- Thread selector: skeleton cards (4 of them)
- Chat area: skeleton message bubbles (3–4 of varying widths)
- Reply composer visible but input disabled while loading

### Error State:
- If threads fail to load: error message in thread selector with retry button
- If messages for a thread fail: error message in chat area with retry button
- Reply composer disabled during error state

## Task 7: Integration with Other Pages

Update navigation and indicators across the app:

1. **Dashboard claim cards** (Phase 1.5): unread message count badge on each card should match the thread's unread count. Clicking the badge or the card's message indicator should navigate to /messages/:claimId

2. **Dashboard "View Messages" quick action** (Phase 1.5): navigate to /messages

3. **Header notification badge** (Phase 1.2/1.5): total unread count should update when messages are marked as read

4. **Sidebar "Messages" nav item** (Phase 1.2): add an unread count badge next to the label if total unread > 0

## Task 8: Typing Indicator (Optional Enhancement)

If time allows, add a simulated typing indicator:

When the client sends a message, after a random delay (3–8 seconds), show a typing indicator from the firm side:
- Three animated dots in a message bubble on the left side
- After 2–3 seconds, the dots disappear (simulating that the firm would reply, but in the mock there is no auto-reply)
- This just adds visual polish — the firm doesn't actually respond in the mock

Only implement this if the core messaging functionality is complete and tested.

</tasks>

<accessibility_requirements>
- Messages page main: aria-label="Messages"
- Thread selector: role="listbox" or role="tablist", aria-label="Message threads"
- Each thread card: role="option" or role="tab", aria-selected for active thread, aria-label describing claim and unread count (e.g. "Vanquis Bank, 1 unread message")
- Chat area: role="log", aria-label="Conversation with {lenderName}", aria-live="polite" for new messages
- Each message: article element with aria-label describing sender and time
- Firm messages: visually distinct from client messages for colour-blind users (not just colour — position and avatar differentiate them)
- Unread divider: role="separator", aria-label="New messages below"
- Reply input: aria-label="Type your message", aria-describedby linking to character count
- Send button: aria-label="Send message", disabled state announced
- Character count: aria-live="polite" (announced when limit approaches)
- Failed message retry: role="button", aria-label="Message failed to send. Tap to retry."
- Date separators: role="separator", aria-label with the date
- Mobile back button: aria-label="Back to message threads"
- Loading skeletons: aria-hidden="true"
- Keyboard: Tab navigates between thread selector and chat area. Within chat, focus goes to the reply input. Arrow keys can navigate threads in the selector.
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── messages.ts                    (new — message API functions)
│   └── mocks/
│       └── messages.ts                (new — mock message data and functions)
├── components/
│   └── messages/
│       ├── ThreadSelector.tsx         (new — left panel thread list)
│       ├── ThreadCard.tsx             (new — individual thread card)
│       ├── ChatHeader.tsx             (new — chat area header)
│       ├── MessageThread.tsx          (new — scrollable message list)
│       ├── MessageBubble.tsx          (new — individual message bubble)
│       ├── ReplyComposer.tsx          (new — text input + send button)
│       ├── DateSeparator.tsx          (new — date divider between messages)
│       ├── UnreadDivider.tsx          (new — "New messages" divider)
│       └── TypingIndicator.tsx        (new — optional animated dots)
├── pages/
│   └── Messages.tsx                   (updated from placeholder)
└── App.tsx                            (route for /messages/:claimId if not already present)
```
</files_expected>

<test_scenarios>
**Thread Selector:**
1. Messages page loads → 4 threads listed (Vanquis, NewDay, Zopa, MoneyBoat)
2. Threads sorted: unread first (Vanquis 1, NewDay 2, Zopa 1), then MoneyBoat (no messages) last
3. Each thread shows lender name, last message preview truncated, relative time, unread badge
4. MoneyBoat shows "No messages yet"
5. Clicking a thread highlights it and loads the conversation

**Chat — Vanquis Thread (4 messages, 1 unread):**
6. Select Vanquis → 4 messages load, firm messages left-aligned, client message right-aligned
7. Firm messages show avatar with initials, sender name and role
8. Client message shows brand-primary bubble, right-aligned, no avatar
9. "New messages" divider appears before the unread message (Message 4)
10. After 2 seconds, unread count updates to 0, divider fades
11. Messages grouped correctly (Messages 2 and 3 are close together on the same day)
12. Date separator shown between different days

**Chat — NewDay Thread (6 messages, 2 unread):**
13. Scroll position starts at bottom (most recent messages visible)
14. "New messages" divider before Message 5
15. Both firm senders shown (James Taylor and Emma Roberts with different initials)

**Chat — Zopa Thread (3 messages, 1 unread):**
16. Messages display correctly with offer-related content

**Chat — MoneyBoat Thread (empty):**
17. Empty state: "No messages yet" with lender name

**Sending Messages:**
18. Type a message → send button enables
19. Click send → message appears immediately (optimistic update), input clears
20. Message shows "sending" state briefly then settles into normal styling
21. Shift+Enter inserts a new line in the input
22. Enter sends the message (desktop)
23. Empty/whitespace-only input → send button disabled
24. Type 2001+ characters → input stops accepting, counter shows red "2000/2000"
25. At 1800 characters → counter shows amber warning

**Mark as Read:**
26. Open a thread with unread messages → after 2 seconds, unread count clears
27. Thread card badge updates to remove unread count
28. Header notification badge total decreases
29. Switch threads before 2 seconds → previous thread unread count NOT cleared

**Mobile:**
30. Mobile (375px): thread list shown first, no chat visible
31. Tap a thread → slides to chat view with back arrow
32. Tap back arrow → slides back to thread list
33. Direct URL /messages/RR-676687-554/01 → opens chat view directly with back button

**Desktop No Selection:**
34. Navigate to /messages (no thread selected) → chat area shows "Select a conversation" placeholder

**Error Handling:**
35. If messages fail to load → error in chat area with retry button
36. If send fails → message shows "Failed to send. Tap to retry."
37. Tapping retry resends the message

**Integration:**
38. Dashboard claim card unread indicator matches thread unread count
39. Dashboard "View Messages" navigates to /messages
40. Sidebar "Messages" shows total unread badge

**Theming:**
41. Dark theme: message bubbles distinguishable, avatar circles visible, dividers visible
42. High contrast: firm vs client messages clearly differentiated beyond just colour
43. Extra Large font: messages readable, bubbles expand to fit content, input area usable

**Responsive:**
44. Desktop (1024px+): side-by-side thread list + chat
45. Tablet (768px): narrower thread list + chat
46. Mobile (375px): two-view navigation with slide transition
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Thread selector lists all claims with message previews and unread badges
- [ ] Threads sorted by unread first, then most recent
- [ ] Selecting a thread loads the full conversation
- [ ] Firm messages left-aligned with avatar, name, role, and timestamp
- [ ] Client messages right-aligned with brand-primary bubble
- [ ] Messages grouped when same sender within 5 minutes
- [ ] Date separators shown between messages on different days
- [ ] "New messages" divider shown above first unread message
- [ ] Auto-scroll to bottom on initial load and after sending
- [ ] "New message ↓" button shown if user scrolled up and new content arrives
- [ ] Reply composer: expandable textarea, character limit (2000), counter shown at 1500+
- [ ] Send button disabled when input empty, shows spinner while sending
- [ ] Enter sends on desktop, Shift+Enter for new line
- [ ] Optimistic update: message appears instantly, settles after API response
- [ ] Failed sends show retry option
- [ ] Mark as read after 2 seconds of viewing unread messages
- [ ] Unread counts update in thread selector, header badge, and sidebar
- [ ] Empty thread shows appropriate message
- [ ] Desktop: side-by-side layout with "Select a conversation" default state
- [ ] Mobile: two-view navigation with slide transition
- [ ] URL updates when selecting threads (/messages/:claimId)
- [ ] All 3 themes render correctly
- [ ] All 3 font sizes scale correctly
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] All accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 4.1 will build the Offer Review and E-Signature flow — the full acceptance process when a client receives a settlement offer. It includes offer details display, terms of acceptance, typed and drawn signature options, confirmation modal, and post-acceptance status updates. It connects to the Zopa claim mock data which already has an offer.
</notes_for_next_phase>
