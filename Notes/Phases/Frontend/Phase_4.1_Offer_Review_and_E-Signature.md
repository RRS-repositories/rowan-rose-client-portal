# Rowan Rose Client Portal — Phase 4.1: Offer Review & E-Signature

<context>
Phases 1.1 through 3.1 are complete. The app has a working design system, layout shell, full auth flow, session management, dashboard with claim cards, claim detail view with progress stepper and financial summary, documents page with drag-and-drop upload, and messages page with per-claim chat threads. Mock data exists for 4–6 claims including one (Zopa, RR-676687-554/04) in the "Offer Received" phase with an offer amount of £2,450.00.

This is Phase 4.1. You are building the offer acceptance flow — the process clients go through when a settlement offer is received from a lender. This is a critical workflow because it involves a legally binding acceptance with an electronic signature. The flow must be clear, professional, and accessible for clients aged 18–70.

The offer acceptance flow is accessed from the Claim Detail page when a claim is in the "Offer Received" phase. All API calls continue to be MOCKED.
</context>

<tasks>

## Task 1: Mock Data — Offer Details

Extend the existing Zopa claim mock data and create new mock types and API functions.

Add types to `src/types/index.ts` or a new `src/types/offers.ts`:

```typescript
interface OfferDetails {
  claimId: string;
  lenderName: string;
  offerAmount: number;
  offerDate: string;                    // ISO date — when the offer was made
  expiryDate: string;                   // ISO date — offer expires after this date
  offerReference: string;               // e.g. "ZOPA-OFF-2026-0487"
  termsOfAcceptance: string;            // Full legal text of the terms
  feePercentage: number;               // Firm's fee percentage
  estimatedFeeAmount: number;           // Calculated fee
  estimatedNetToClient: number;         // Offer minus fee
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface OfferAcceptancePayload {
  claimId: string;
  offerReference: string;
  signatureType: 'typed' | 'drawn';
  signatureData: string;               // Typed: the name string. Drawn: base64 PNG data
  agreedToTerms: boolean;
  acceptedAt: string;                   // ISO timestamp
}

interface OfferAcceptanceResponse {
  success: boolean;
  message: string;
  updatedStatus: string;               // New claim status after acceptance
}
```

Mock offer data for Zopa claim:
```typescript
{
  claimId: "RR-676687-554/04",
  lenderName: "Zopa",
  offerAmount: 2450.00,
  offerDate: "2026-05-21",
  expiryDate: "2026-06-21",
  offerReference: "ZOPA-OFF-2026-0487",
  termsOfAcceptance: `TERMS OF ACCEPTANCE

By accepting this offer, you ("the Client") agree to the following terms:

1. SETTLEMENT AMOUNT
The lender, Zopa, has offered a settlement of £2,450.00 (two thousand four hundred and fifty pounds) in full and final settlement of your complaint regarding irresponsible lending.

2. FULL AND FINAL SETTLEMENT
Acceptance of this offer constitutes a full and final settlement of your complaint. You will not be able to pursue any further claims against the lender in relation to this matter.

3. FEES
Rowan Rose Solicitors will deduct their agreed fee of 25% (inclusive of VAT) from the settlement amount. The estimated fee is £612.50, leaving an estimated net payment to you of £1,837.50.

4. PAYMENT TIMELINE
The lender has agreed to make payment within 28 days of receiving the signed acceptance. Rowan Rose Solicitors will process your payment within 5 working days of receiving the funds from the lender.

5. WITHDRAWAL
Once this acceptance is signed and submitted, it cannot be withdrawn. Please ensure you are satisfied with the terms before signing.

6. DATA PROCESSING
Your signed acceptance will be stored securely in compliance with GDPR. The signature and acceptance record will be shared with the lender as proof of your agreement.

7. GOVERNING LAW
This agreement is governed by the laws of England and Wales.

If you have any questions about these terms, please contact your claims handler before signing.`,
  feePercentage: 25,
  estimatedFeeAmount: 612.50,
  estimatedNetToClient: 1837.50,
  status: 'pending'
}
```

Create `src/api/mocks/offers.ts`:

```typescript
// GET /client/offers/:claimId — get offer details for a claim
function getOfferDetails(claimId: string): Promise<OfferDetails>
// Simulate 600ms delay
// Return the Zopa offer data if claimId matches, otherwise return null/404

// POST /client/offers/:claimId/accept — submit signed acceptance
function acceptOffer(claimId: string, payload: OfferAcceptancePayload): Promise<OfferAcceptanceResponse>
// Simulate 2 second delay (longer because this is a critical legal action)
// Return { success: true, message: "Offer accepted successfully. The lender will process payment within 28 days.", updatedStatus: "Offer Accepted" }

// POST /client/offers/:claimId/reject — reject an offer
function rejectOffer(claimId: string, reason?: string): Promise<{ success: boolean; message: string }>
// Simulate 1 second delay
// Return { success: true, message: "Offer rejected. We will pursue further action on your behalf." }
```

Add corresponding functions to `src/api/offers.ts`.

## Task 2: Offer Banner on Claim Detail Page

Update the Claim Detail page (Phase 1.6) to show a prominent offer section when the claim is in "Offer Received" status.

This replaces or supplements the existing ActionItems component for offer claims.

Offer banner card at the top of the action items section:
- Background: status-offer colour at 10% opacity with a left border 4px solid status-offer (green)
- Icon: Gift from lucide-react in status-offer colour
- Heading: "Settlement Offer Received" in bold, font-size-xl
- Offer amount: "£2,450.00" in font-size-3xl, bold, brand-primary colour
- Subtext: "from {lenderName}" in text-secondary
- Offer date: "Received on {offerDate}" in font-size-sm, text-muted
- Expiry notice: "This offer expires on {expiryDate}" in font-size-sm, amber colour if within 7 days of expiry, red if within 3 days
- Two buttons:
  - "Review & Accept" (primary, large) — navigates to the offer acceptance page
  - "Reject Offer" (danger/ghost variant, smaller) — opens rejection confirmation modal

If the offer has already been accepted:
- Banner changes to a green success card
- "Offer Accepted" heading with CheckCircle icon
- "You accepted this offer on {acceptedDate}. The lender will process payment within 28 days."
- No action buttons

If the offer has been rejected:
- Banner changes to a grey/muted card
- "Offer Rejected" heading
- "This offer was rejected. We are pursuing further action on your behalf."
- No action buttons

## Task 3: Offer Acceptance Page

Create a new dedicated page for reviewing and accepting an offer. This is a multi-section, single-page flow (not multi-step like registration — the client scrolls through everything on one page).

Route: /claims/:claimId/accept-offer (new route)
File: Create `src/pages/OfferAcceptance.tsx`

Protected route — must be authenticated. If the claim does not have a pending offer, redirect to the claim detail page.

### 3a. Page Header

- Back link: "← Back to claim details" → /claims/:claimId
- Heading: "Review Settlement Offer" in font-size-2xl
- Subheading: "{lenderName} — {claimId}" in text-secondary

### 3b. Offer Summary Card

A prominent card showing the key financial figures:

```
┌─────────────────────────────────────────────┐
│  Settlement Offer                           │
│                                             │
│  Offer Amount          £2,450.00            │
│  ─────────────────────────────────          │
│  Firm Fee (25%)        - £612.50            │
│  ─────────────────────────────────          │
│  Estimated to You       £1,837.50           │
│                                             │
│  Offer Reference: ZOPA-OFF-2026-0487        │
│  Offer Date: 21 May 2026                    │
│  Expires: 21 June 2026                      │
└─────────────────────────────────────────────┘
```

Styling:
- Offer amount: font-size-2xl, bold, text-primary
- Fee line: font-size-base, text-muted (it is a deduction, show with minus sign)
- Net to client: font-size-xl, bold, brand-primary colour — this is the headline figure
- Divider lines between sections
- Reference, date, expiry in font-size-sm, text-muted
- Expiry date highlighted in amber if within 7 days, red if within 3 days
- Card background: var(--bg-secondary)

### 3c. Terms of Acceptance

A scrollable container showing the full terms text:

- Section heading: "Terms of Acceptance" in font-size-xl
- Instruction text: "Please read the following terms carefully before signing." in text-secondary
- Scrollable text area:
  - Fixed height: 300px on desktop, 250px on mobile
  - Overflow-y: auto with scroll indicator
  - Background: var(--bg-primary) with 1px border
  - Padding: 24px
  - Text: font-size-sm, text-primary, preserving paragraphs and numbered lists from the terms string
  - Scroll shadow: subtle shadow at top/bottom when content is scrollable in that direction
- Track scroll progress:
  - The client MUST scroll to the bottom of the terms before the agreement checkbox becomes enabled
  - Show a progress indicator: "Scroll to read all terms" with a small down arrow, disappears once fully scrolled
  - When fully scrolled: show a subtle checkmark or "You have read the terms" confirmation

### 3d. Agreement Checkbox

Below the terms container:

- Checkbox with label: "I, {clientFullName}, have read and agree to the above Terms of Acceptance. I understand that this acceptance is final and cannot be withdrawn."
- Checkbox is DISABLED until the client has scrolled to the bottom of the terms
- When disabled: greyed out with tooltip "Please read the full terms above before agreeing"
- When enabled and unchecked: normal interactive state
- When checked: border colour changes to brand-primary
- Required — cannot proceed to signature without checking this

### 3e. Electronic Signature Section

Section heading: "Sign to Accept" in font-size-xl
Instruction text: "Please provide your signature below to confirm your acceptance of this offer." in text-secondary

Two tabs/options for signing:

**Tab 1: Type Your Name**
- Text input field
- Label: "Type your full legal name"
- Placeholder: "Enter your full name as it appears on your ID"
- Below the input: signature preview area showing the typed name rendered in a cursive/signature-style font (e.g. use CSS font-family: 'Dancing Script', cursive — import from Google Fonts, or use a similar handwriting-style web font)
- Preview area: white/light background, bottom border (simulating a signature line), padding 20px
- Preview text: font-size-2xl in the signature font, text-primary
- Name validation: must contain at least 2 words (first and last name), minimum 4 characters total
- If the typed name does not reasonably match the authenticated user's name: show a warning (not a block): "The name you entered does not match our records ({user.firstName} {user.lastName}). Please ensure you use your full legal name."

**Tab 2: Draw Your Signature**
- HTML5 Canvas drawing area
- Size: full width of the container, 200px height on desktop, 150px on mobile
- Background: white with a subtle grey signature line across the middle
- Border: 1px solid var(--border), rounded corners 8px
- Drawing: smooth line following mouse/touch input
- Pen colour: dark navy/black (#1A1A2E)
- Pen width: 2px
- Touch support: works with finger drawing on mobile/tablet (prevent page scroll while drawing)
- Controls below the canvas:
  - "Clear" button (ghost variant) — clears the canvas
  - "Undo" button (ghost variant) — removes the last stroke
- Minimum signature requirement: the canvas must not be empty (detect if any drawing has been made)
- If canvas is empty when trying to submit: show error "Please draw your signature"

Tab switching:
- Use a simple tab component or toggle buttons: "Type" | "Draw"
- Active tab highlighted in brand-primary
- Switching tabs clears the other tab's input (warn if data will be lost)
- Store the signature data from whichever tab is active at submission time

### 3f. Date and Confirmation

Below the signature:
- Auto-filled date: "Date: {today's date in UK format}" in text-secondary — not editable
- Summary line: "By signing above, you are accepting a settlement offer of £{amount} from {lenderName}."

### 3g. Submit Buttons

Two buttons at the bottom:

- "Accept Offer" (primary, large, full-width on mobile)
  - Disabled until: agreement checkbox is checked AND a valid signature is provided (typed name with 2+ words, or non-empty canvas drawing)
  - On click: opens the confirmation modal (Task 4)

- "Cancel" (ghost variant) — navigates back to /claims/:claimId without submitting

Sticky on mobile:
- On mobile, the "Accept Offer" and "Cancel" buttons should be sticky at the bottom of the viewport so they are always accessible without scrolling

## Task 4: Acceptance Confirmation Modal

When "Accept Offer" is clicked, show a confirmation modal before submitting. This is a critical action — the modal prevents accidental acceptance.

Create `OfferConfirmationModal.tsx` in `src/components/offers/`:

Modal content:
- Heading: "Confirm Offer Acceptance" in font-size-xl
- Warning icon: AlertTriangle in amber
- Message: "You are about to accept a settlement offer of £{amount} from {lenderName}. This action is final and cannot be reversed."
- Financial summary (brief):
  - "Offer: £{amount}"
  - "Fee ({feePercentage}%): -£{feeAmount}"
  - "You will receive: £{netToClient}"
- Signature preview: show the typed name or drawn signature image in a small preview
- Final confirmation text: "Are you sure you want to proceed?" in bold

Buttons:
- "Yes, Accept Offer" (primary) — submits the acceptance
- "Go Back" (ghost) — closes the modal, returns to the form

On "Yes, Accept Offer":
- Close the modal
- Show full-page loading overlay: "Submitting your acceptance..." with a spinner
- Call acceptOffer mock API
- On success: navigate to the acceptance success page (Task 5)
- On failure: show error toast "Something went wrong. Please try again." and return to the form

Modal behaviour:
- Overlay backdrop (semi-transparent dark)
- Focus trapped inside modal
- Escape key triggers "Go Back" (safe default — do not accidentally accept)
- role="alertdialog"
- aria-describedby linking to the warning message

## Task 5: Acceptance Success Page

Route: /claims/:claimId/offer-accepted (new route)
File: Create `src/pages/OfferAccepted.tsx`

This page is shown immediately after a successful offer acceptance. It should feel celebratory but professional.

Page content:
- Large green animated checkmark (scale up + fade in animation, same style as RegistrationSuccess)
- Heading: "Offer Accepted!" in font-size-2xl, brand-primary colour
- Subheading: "Your acceptance has been submitted to {lenderName}." in text-secondary

What happens next card:
- Card with a numbered list of next steps:
  1. "Your signed acceptance has been sent to {lenderName}."
  2. "The lender will process your payment within 28 days."
  3. "Once we receive the funds, our fee of {feePercentage}% (£{feeAmount}) will be deducted."
  4. "Your net settlement of £{netToClient} will be paid to you within 5 working days."
  5. "You will receive an email confirmation and can track the payment progress in your dashboard."

Summary card:
- Offer amount: £{amount}
- Fee: £{feeAmount}
- You will receive: £{netToClient}

Buttons:
- "View Claim" (primary) — navigates to /claims/:claimId (claim detail should now show "Offer Accepted" status)
- "Back to Dashboard" (secondary) — navigates to /dashboard

## Task 6: Offer Rejection Flow

When "Reject Offer" is clicked on the claim detail page offer banner (Task 2), show a rejection confirmation modal.

Create `OfferRejectionModal.tsx` in `src/components/offers/`:

Modal content:
- Heading: "Reject Offer"
- Warning message: "Are you sure you want to reject this offer of £{amount} from {lenderName}?"
- Explanation: "If you reject this offer, we will continue to pursue your claim through alternative channels. This may take longer but could result in a higher settlement."
- Optional textarea: "Reason for rejection (optional)" — placeholder "Tell us why you are rejecting this offer..."
- Buttons:
  - "Yes, Reject Offer" (danger variant)
  - "Keep Offer" (ghost) — closes modal

On rejection:
- Call rejectOffer mock API
- On success: show toast "Offer rejected. We will continue pursuing your claim."
- Update claim status to "Offer Rejected" in the local state
- Claim detail page updates to show rejected banner
- Navigate back to claim detail

## Task 7: Update Claim Status After Acceptance/Rejection

When an offer is accepted or rejected, the claim's status should update throughout the app:

After acceptance:
- Claim internal status changes to "Offer Accepted"
- Dashboard card: badge changes to "Offer Received" (same phase, different status message)
- Claim detail: status message updates to "You have accepted the offer. We are now awaiting payment from the lender."
- Timeline: new event added "Offer accepted by client"
- Offer banner: changes to "Offer Accepted" success card

After rejection:
- Claim internal status changes to "Offer Rejected"
- Dashboard card: badge stays "Offer Received" but status message updates
- Claim detail: status message updates to "The offer has been rejected and we are pursuing further action on your behalf."
- Timeline: new event added "Offer rejected by client"
- Offer banner: changes to "Offer Rejected" muted card

For the mock, update the claim data in local state (or in the mock data store if using a mutable mock). This simulates what would happen when the real CRM updates.

## Task 8: Signature Canvas Component

Create a reusable `SignatureCanvas.tsx` in `src/components/ui/`:

Props:
```typescript
interface SignatureCanvasProps {
  width?: number;              // Default: container width
  height?: number;             // Default: 200px desktop, 150px mobile
  penColour?: string;          // Default: "#1A1A2E"
  penWidth?: number;           // Default: 2
  backgroundColour?: string;   // Default: "#FFFFFF"
  signatureLine?: boolean;     // Show a horizontal line. Default: true
  onChange?: (isEmpty: boolean) => void;  // Callback when drawing changes
  onClear?: () => void;
  disabled?: boolean;
}

// Exposed methods (via ref):
interface SignatureCanvasRef {
  toDataURL(): string;         // Returns base64 PNG of the signature
  clear(): void;
  undo(): void;
  isEmpty(): boolean;
}
```

Implementation details:
- Use HTML5 Canvas API
- Track mouse events: mousedown (start drawing), mousemove (draw), mouseup (stop)
- Track touch events: touchstart, touchmove, touchend (for mobile)
- Prevent default touch behaviour (page scroll) while drawing on the canvas
- Store strokes as arrays of points for undo functionality
- Undo removes the last complete stroke (mousedown to mouseup)
- Clear removes all strokes
- Use requestAnimationFrame for smooth drawing
- Handle window resize: redraw the canvas content when resized
- High-DPI support: set canvas resolution to devicePixelRatio for sharp lines on retina displays

</tasks>

<routing_updates>
Add these new routes to App.tsx (all protected, inside Layout wrapper):

```
/claims/:claimId/accept-offer    → OfferAcceptance.tsx (new)
/claims/:claimId/offer-accepted  → OfferAccepted.tsx (new)
```

Handle the claim ID format in URLs (same approach as Phase 1.6).
</routing_updates>

<accessibility_requirements>
- Offer summary card: use description list (dl/dt/dd) for financial figures
- Terms scrollable area: role="document", aria-label="Terms of acceptance", tabindex="0" so keyboard users can scroll
- Scroll progress indicator: aria-live="polite" announcing when fully scrolled
- Agreement checkbox: aria-describedby linking to the full checkbox label text
- Disabled checkbox: aria-disabled="true" with tooltip accessible via keyboard
- Signature tabs: role="tablist" with role="tab" for each tab, role="tabpanel" for content
- Typed signature input: aria-label="Type your full legal name as your signature"
- Signature canvas: role="img" when has content, aria-label="Your drawn signature". Provide accessible alternative: "If you cannot draw a signature, use the Type tab instead."
- Canvas: keyboard accessible — not practical to draw with keyboard, so ensure the typed name option is fully keyboard accessible as an alternative
- Clear and Undo buttons: aria-labels
- Confirmation modal: role="alertdialog", focus trapped, aria-describedby
- Rejection modal: role="alertdialog", focus trapped
- Accept button disabled state: aria-disabled with explanation
- Success page checkmark: aria-hidden (decorative), heading announces the success
- Financial figures: proper currency formatting readable by screen readers
- Loading overlay: aria-live="assertive" announcing "Submitting your acceptance"
- All form errors announced via aria-live
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── offers.ts                      (new — offer API functions)
│   └── mocks/
│       └── offers.ts                  (new — mock offer data and functions)
├── components/
│   ├── offers/
│   │   ├── OfferSummaryCard.tsx       (new — financial summary card)
│   │   ├── TermsOfAcceptance.tsx      (new — scrollable terms with tracking)
│   │   ├── SignatureSection.tsx       (new — tabbed typed/drawn signature)
│   │   ├── OfferConfirmationModal.tsx (new — acceptance confirmation)
│   │   └── OfferRejectionModal.tsx    (new — rejection confirmation)
│   └── ui/
│       └── SignatureCanvas.tsx        (new — reusable canvas drawing component)
├── pages/
│   ├── OfferAcceptance.tsx            (new — full acceptance flow page)
│   ├── OfferAccepted.tsx              (new — success page)
│   └── ClaimDetail.tsx                (updated — offer banner integration)
├── types/
│   └── offers.ts                      (new — offer-related types)
└── App.tsx                            (updated with new routes)
```
</files_expected>

<test_scenarios>
**Offer Banner on Claim Detail:**
1. Open Zopa claim detail → offer banner shows with £2,450.00, green styling
2. Offer date and expiry date displayed correctly
3. "Review & Accept" button navigates to /claims/RR-676687-554/04/accept-offer
4. "Reject Offer" button opens rejection modal

**Offer Acceptance Page — Display:**
5. Page loads with offer summary showing £2,450.00 offer, £612.50 fee, £1,837.50 net
6. Offer reference and dates shown correctly
7. Terms of acceptance scrollable container shows full terms text
8. Agreement checkbox is disabled initially with greyed-out styling

**Terms Scrolling:**
9. Scroll partially → checkbox remains disabled, "Scroll to read all terms" indicator visible
10. Scroll to the very bottom → indicator disappears, "You have read the terms" shown
11. Agreement checkbox becomes enabled
12. Check the checkbox → label text includes client's full name

**Typed Signature:**
13. "Type" tab active by default
14. Type "Sarah Mitchell" → preview shows the name in cursive font
15. Type only "Sarah" (one word) → validation warning "Please enter your full legal name (first and last name)"
16. Type a different name → warning about name not matching records (non-blocking)

**Drawn Signature:**
17. Switch to "Draw" tab → canvas appears with signature line
18. Draw on canvas with mouse → signature appears smoothly
19. Click "Undo" → last stroke removed
20. Click "Clear" → canvas emptied
21. Touch drawing works on mobile (finger drawing, no page scroll while drawing)
22. Switching from Draw tab (with drawing) to Type tab → warns about losing drawn signature

**Submit Flow:**
23. Check agreement + provide valid signature → "Accept Offer" button enables
24. Click "Accept Offer" → confirmation modal appears with financial summary and signature preview
25. Click "Go Back" on modal → returns to form, nothing submitted
26. Click "Yes, Accept Offer" → loading overlay "Submitting your acceptance...", then navigates to success page
27. Escape key on modal triggers "Go Back" (safe default)

**Success Page:**
28. Success page shows checkmark animation
29. "What happens next" shows 5 numbered steps
30. Financial summary shows offer, fee, and net amounts
31. "View Claim" navigates to claim detail
32. Claim detail now shows "Offer Accepted" status, green success banner, no action buttons

**Rejection Flow:**
33. Click "Reject Offer" on claim detail → rejection modal appears
34. Enter optional reason → click "Yes, Reject Offer"
35. Toast: "Offer rejected. We will continue pursuing your claim."
36. Claim detail updates to show "Offer Rejected" muted banner
37. Dashboard card status message updates

**Status Updates:**
38. After acceptance: dashboard Zopa card message changes to "You have accepted the offer..."
39. After acceptance: claim timeline shows new "Offer accepted" event
40. After rejection: dashboard card message updates accordingly

**Edge Cases:**
41. Navigate to /claims/RR-676687-554/01/accept-offer (claim without offer) → redirected to claim detail
42. Navigate to accept-offer page after offer already accepted → redirected with message
43. Offer expired (modify mock expiry date to past) → show "This offer has expired" message, no accept button

**Responsive:**
44. Desktop: full layout with wide terms area and signature canvas
45. Mobile (375px): stacked layout, smaller canvas (150px height), sticky accept/cancel buttons at bottom
46. Signature canvas touch drawing works on mobile without triggering page scroll
47. Terms scroll works correctly on mobile

**Theming:**
48. Dark theme: terms text readable, signature canvas has appropriate contrast, financial card visible
49. High contrast: all text readable, signature canvas border visible, buttons distinguishable
50. Extra Large font: all text scales, terms container height sufficient, signature preview readable

**Accessibility:**
51. Keyboard-only: can tab through all sections, check checkbox, type signature, submit
52. Terms scrollable via keyboard (arrow keys/spacebar when focused)
53. Disabled checkbox has aria-disabled and tooltip accessible via keyboard
54. Screen reader announces scroll progress and form errors
55. Confirmation modal traps focus and is announced properly
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Offer banner on claim detail shows correct amount, dates, and action buttons
- [ ] Offer acceptance page displays financial summary with offer, fee, and net amounts
- [ ] Terms of acceptance scrollable container shows full legal text
- [ ] Agreement checkbox disabled until terms fully scrolled
- [ ] Checkbox label includes the client's full name
- [ ] Typed signature: input field with cursive preview, validates 2+ words
- [ ] Drawn signature: canvas works with mouse and touch, clear and undo work
- [ ] High-DPI canvas rendering for sharp lines on retina displays
- [ ] Switching signature tabs warns about data loss
- [ ] Accept button disabled until checkbox checked AND valid signature provided
- [ ] Confirmation modal shows financial summary and signature preview
- [ ] Escape on confirmation modal cancels (does not accept)
- [ ] Successful acceptance navigates to success page with animation
- [ ] Success page shows next steps and financial summary
- [ ] Claim status updates to "Offer Accepted" across dashboard and claim detail
- [ ] Timeline adds "Offer accepted" event
- [ ] Rejection modal with optional reason field works correctly
- [ ] Rejected claim updates status across the app
- [ ] Claims without offers redirect away from acceptance page
- [ ] Already-accepted offers show success banner instead of action buttons
- [ ] Sticky submit buttons on mobile
- [ ] All 3 themes render correctly
- [ ] All 3 font sizes scale correctly
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] All accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 5.1 will build the Profile page — personal details (read-only), change password functionality, notification preferences with toggles, and the theme/font size settings panel integrated into the profile. This is the last frontend feature phase before moving to backend integration.
</notes_for_next_phase>
