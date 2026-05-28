# Rowan Rose Client Portal — Phase 5.1: Profile & Notification Preferences

<context>
Phases 1.1 through 4.1 are complete. The app has a working design system, layout shell, full auth flow, session management, dashboard with claim cards, claim detail view with progress stepper and financial summary, documents page with drag-and-drop upload, messages page with per-claim chat threads, and offer review with e-signature acceptance flow. The full web app frontend feature set is nearly complete.

This is Phase 5.1 — the last frontend feature phase. You are building the Profile page where clients can view their personal details, change their password, manage notification preferences, and adjust accessibility settings (theme and font size). The SettingsPanel component from Phase 1.1 will be integrated here as the permanent home for theme and font size controls (it also remains accessible from the header gear icon).

All API calls continue to be MOCKED.
</context>

<tasks>

## Task 1: Mock Data — Profile & Preferences

Extend the mock data and API layer with profile-related data.

Add types to `src/types/index.ts` or a new `src/types/profile.ts`:

```typescript
interface ClientProfile {
  clientId: string;              // e.g. "RR-676687-554"
  firstName: string;
  lastName: string;
  dateOfBirth: string;           // ISO date
  email: string;
  phone: string;                 // Full phone number (will be masked on display)
  registeredAt: string;          // ISO date — when they created their portal account
  totalClaims: number;
  activeClaims: number;
}

interface NotificationPreferences {
  statusChanges: boolean;        // Email when a claim status changes
  newMessages: boolean;          // Email when a new message is received
  documentRequests: boolean;     // Email when documents are needed
  offerNotifications: boolean;   // Email when an offer is received
  paymentUpdates: boolean;       // Email when payment is sent
  marketingEmails: boolean;      // Optional marketing communications
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
}
```

Create `src/api/mocks/profile.ts`:

```typescript
// GET /client/profile — returns client profile data
function getClientProfile(): Promise<ClientProfile>
// Simulate 500ms delay
// Return mock data for Sarah Mitchell:
// {
//   clientId: "RR-676687-554",
//   firstName: "Sarah",
//   lastName: "Mitchell",
//   dateOfBirth: "1988-03-14",
//   email: "client@test.com",
//   phone: "+447912345678",
//   registeredAt: "2026-04-15",
//   totalClaims: 4,  (or 6 if extra claims were added)
//   activeClaims: 3
// }

// GET /client/preferences — returns notification preferences
function getNotificationPreferences(): Promise<NotificationPreferences>
// Simulate 400ms delay
// Return default preferences (all true except marketingEmails which is false)

// PUT /client/preferences — update notification preferences
function updateNotificationPreferences(prefs: NotificationPreferences): Promise<UpdatePreferencesResponse>
// Simulate 800ms delay
// Always return { success: true, message: "Preferences updated successfully." }

// POST /client/change-password — change password
function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse>
// Simulate 1.5 second delay
// If currentPassword is "Password1" → return { success: true, message: "Password changed successfully." }
// If currentPassword is anything else → return { success: false, message: "Current password is incorrect." }
```

Add corresponding functions to `src/api/profile.ts`.

## Task 2: Profile Page Layout

Route: /profile
File: Update `src/pages/Profile.tsx` (replace the placeholder)

The profile page is divided into clearly separated sections with dividers between them. Each section has its own heading and can be independently understood.

Page layout (top to bottom):
1. Page heading: "My Profile" with User icon
2. Personal Details section
3. Divider
4. Account Security section (change password)
5. Divider
6. Notification Preferences section
7. Divider
8. Appearance & Accessibility section (theme + font size)
9. Divider
10. Account Actions section (log out all devices)

Fetch profile and preferences data on mount using useFetch. Show skeleton loaders while loading.

## Task 3: Personal Details Section

A read-only display of the client's personal information. Clients cannot edit these details through the portal — they must contact the firm to make changes.

Section heading: "Personal Details" with a small info icon
Subheading: "To update your personal details, please contact us." in text-muted, font-size-sm

Display fields as a clean two-column layout on desktop (label left, value right), stacked on mobile:

| Field | Value | Notes |
|-------|-------|-------|
| Full Name | Sarah Mitchell | firstName + lastName combined |
| Date of Birth | 14 March 1988 | Formatted with formatUKDate |
| Email Address | client@test.com | Show as-is |
| Phone Number | *******5678 | Mask all but last 4 digits for security |
| Client ID | RR-676687-554 | Monospaced/code font for clarity |
| Member Since | 15 April 2026 | Formatted with formatUKDate |
| Total Claims | 4 | Simple number |
| Active Claims | 3 | Simple number, linked to /claims |

Styling:
- Each field row: padding 12px 0, border-bottom 1px solid var(--border) on the last item of each pair
- Labels: font-size-sm, text-secondary, font-weight 500
- Values: font-size-base, text-primary
- Phone number mask: show dots or asterisks for hidden digits
- "Active Claims" value: clickable link in brand-primary colour, navigates to /claims
- Card background: var(--bg-secondary), padding 24px, rounded corners

Contact information at the bottom of the section:
- "Need to update your details? Email us at support@rowanrose.co.uk or call 0800 123 4567" in text-muted, font-size-sm
- Email as a mailto link, phone as a tel link

## Task 4: Account Security — Change Password

Section heading: "Account Security" with Shield icon

A collapsible section (collapsed by default to keep the page clean). Click the heading or a "Change Password" button to expand.

### 4a. Collapsed State:
- Heading row with Shield icon, "Account Security" text, and a chevron arrow (ChevronDown)
- Subtext: "Password last changed: Never" or "Password last changed: {date}" in text-muted
- Expand/collapse is animated (smooth height transition)

### 4b. Expanded State — Change Password Form:

Form fields:
1. **Current Password** — password input with show/hide toggle
   - Label: "Current Password"
   - Placeholder: "Enter your current password"
   - Required

2. **New Password** — password input with show/hide toggle
   - Label: "New Password"
   - Placeholder: "Enter your new password"
   - Same validation rules as registration (min 8 chars, uppercase, lowercase, number)
   - Must be different from current password

3. **Confirm New Password** — password input with show/hide toggle
   - Label: "Confirm New Password"
   - Placeholder: "Re-enter your new password"
   - Must match new password

Password requirements checklist (reuse from Phase 1.3):
- Real-time validation as user types
- Checkmarks for met requirements, X for unmet

Password strength indicator (reuse from Phase 1.3):
- 4-segment bar: Weak / Fair / Good / Strong

Additional validation:
- New password must not be the same as current password: "New password must be different from your current password."
- Show validation errors inline below each field

Submit button:
- "Update Password" (primary variant)
- Disabled until: current password filled, all new password requirements met, confirm matches
- Loading state while submitting

Cancel button:
- "Cancel" (ghost variant) — collapses the section and clears all fields

Mock behaviour:
- Current password "Password1" → success
- Any other current password → error "Current password is incorrect"

On success:
- Show success toast: "Password changed successfully."
- Collapse the section
- Clear all fields
- Update "Password last changed" text to today's date

On failure:
- Show inline error on the current password field
- Keep the form open

## Task 5: Notification Preferences

Section heading: "Notification Preferences" with Bell icon
Subheading: "Choose which email notifications you would like to receive." in text-muted

A list of toggle switches, one per notification type:

| Toggle | Label | Description |
|--------|-------|-------------|
| statusChanges | Claim Status Updates | Receive an email when the status of any of your claims changes. |
| newMessages | New Messages | Receive an email when you have a new message from your claims handler. |
| documentRequests | Document Requests | Receive an email when we need documents from you to proceed with a claim. |
| offerNotifications | Settlement Offers | Receive an email when an offer is received for one of your claims. |
| paymentUpdates | Payment Updates | Receive an email when a settlement payment is processed. |
| marketingEmails | Marketing & Updates | Receive occasional emails about our services and useful financial information. |

Toggle switch component:
- Create a reusable `ToggleSwitch.tsx` in `src/components/ui/` if one does not already exist
- Track-style toggle: 44px wide, 24px tall, rounded pill shape
- Off state: var(--bg-tertiary) track, white circle
- On state: brand-primary track, white circle shifted right
- Smooth transition animation (200ms)
- Label text to the right of the toggle
- Description text below the label in font-size-sm, text-muted
- Focus ring on the toggle for keyboard users
- Accessible: role="switch", aria-checked="true/false", aria-label with the label text

Layout:
- Each toggle row: padding 16px 0, border-bottom 1px solid var(--border)
- Last row: no border
- Card background: var(--bg-secondary)

Important notice below the toggles:
- Info icon with text: "We recommend keeping Claim Status Updates, Settlement Offers, and Payment Updates enabled to stay informed about your claims." in text-muted, font-size-sm
- If the user turns off offerNotifications or paymentUpdates, show an amber warning: "Disabling this notification means you may miss important updates about your claim. Are you sure?" — with "Keep Enabled" and "Disable" buttons

Auto-save behaviour:
- Changes are saved automatically when a toggle is switched (no separate save button)
- Show a brief inline "Saved" text with a checkmark next to the changed toggle (fades after 2 seconds)
- If save fails: revert the toggle to its previous state and show error toast
- Debounce: if multiple toggles are changed rapidly, batch the API call (wait 500ms after last change)

## Task 6: Appearance & Accessibility Settings

Section heading: "Appearance & Accessibility" with Palette icon (or Sun/Moon icon)
Subheading: "Customise the look and feel of your portal." in text-muted

This integrates the existing SettingsPanel from Phase 1.1 into the profile page, but with a more detailed layout.

### 6a. Theme Selection

Heading: "Theme" in font-size-base, bold

Three option cards displayed horizontally (or vertically on mobile):

**Light Theme Card:**
- Small preview: a mini card mockup with white background, dark text, green accent
- Label: "Light"
- Description: "Default bright theme"
- Selected state: brand-primary border (2px), checkmark badge in corner

**Dark Theme Card:**
- Small preview: mini card with dark background, light text, green accent
- Label: "Dark"
- Description: "Easier on the eyes in low light"
- Selected state: brand-primary border, checkmark badge

**High Contrast Theme Card:**
- Small preview: mini card with black background, white text, yellow accent
- Label: "High Contrast"
- Description: "Maximum readability and accessibility"
- Selected state: brand-primary border, checkmark badge

Each card:
- Width: flexible (3 cards in a row on desktop, stacked on mobile)
- Clickable: selects the theme immediately (changes apply instantly)
- Hover: subtle border colour change
- Focus: visible focus ring
- Current selection: prominent border + checkmark
- Transition: smooth theme change across the entire app

### 6b. Font Size Selection

Heading: "Text Size" in font-size-base, bold

Three option buttons in a row:

| Option | Label | Preview Text |
|--------|-------|-------------|
| default | Default | "Aa" in 16px |
| large | Large | "Aa" in 20px |
| extra-large | Extra Large | "Aa" in 24px |

Each button:
- Shows "Aa" preview text at the actual size
- Selected state: brand-primary background, white text
- Unselected: var(--bg-tertiary) background, text-primary
- Click applies immediately
- Focus ring for keyboard navigation

Live preview text below the selector:
- "This is how text will appear across the portal." rendered at the currently selected font size
- Helps clients preview the change before navigating away

### 6c. Settings Persistence Note

Small text at the bottom of the section:
- "Your preferences are saved automatically and will be remembered next time you visit." in text-muted, font-size-xs

## Task 7: Account Actions

Section heading: "Account" with Settings icon

A minimal section with account-level actions:

### 7a. Log Out of All Devices

- Description: "Log out of all devices where you are currently signed in. You will need to log in again on this device." in text-secondary
- Button: "Log Out of All Devices" (danger variant, outlined)
- On click: confirmation modal
  - Heading: "Log Out Everywhere"
  - Message: "This will end all your active sessions, including this one. You will be redirected to the login page."
  - Buttons: "Yes, Log Out Everywhere" (danger) and "Cancel" (ghost)
- On confirm: call mock API (simulate 1 second delay), then log out (same as regular logout from Phase 1.4)
- Toast: "All sessions have been ended."

### 7b. Data Export Request (Optional Enhancement)

If time allows:
- Description: "Request a copy of all personal data we hold about you (GDPR Subject Access Request)." in text-secondary
- Button: "Request My Data" (secondary variant)
- On click: confirmation modal
  - Message: "We will prepare a copy of your data and send it to your registered email address within 30 days."
  - Buttons: "Request Data" (primary) and "Cancel" (ghost)
- On confirm: show toast "Data request submitted. You will receive your data at {email} within 30 days."
- This is just a UI flow — no real data export happens in the mock

## Task 8: Toggle Switch Component

Create `src/components/ui/ToggleSwitch.tsx` if it does not already exist:

Props:
```typescript
interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  saving?: boolean;              // Shows a mini spinner or "Saving..." state
  saved?: boolean;               // Shows a brief "Saved ✓" indicator
}
```

Styling:
- Track: 44px wide, 24px tall, rounded pill (12px border-radius)
- Thumb (circle): 20px diameter, white, centred vertically in the track with 2px inset
- Off: track is var(--bg-tertiary) or a muted grey
- On: track is brand-primary
- Transition: thumb slides left/right over 200ms, track colour transitions simultaneously
- Disabled: 50% opacity, cursor not-allowed
- Focus: visible focus ring around the track using var(--border-focus)
- Touch target: minimum 44px total height for the interactive area

Behaviour:
- Click anywhere on the track or label to toggle
- Keyboard: Space or Enter toggles when focused
- Announce state change to screen readers

Saved indicator:
- When saved prop is true: show a small "Saved ✓" text next to the toggle in brand-primary, font-size-xs
- Automatically fades out after 2 seconds (parent component manages this)

## Task 9: Theme Preview Cards Component

Create `src/components/profile/ThemeCard.tsx`:

Props:
```typescript
interface ThemeCardProps {
  theme: 'light' | 'dark' | 'high-contrast';
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}
```

Mini preview inside the card:
- A 120px wide × 80px tall mini mockup showing:
  - A small rectangle representing a "header" bar at the top
  - Two smaller rectangles below representing "content cards"
  - A small circle representing a "button"
  - All elements use the actual theme colours from the CSS variables for that theme
  - This gives clients a visual preview of what each theme looks like

Card sizing:
- Min-width: 150px
- Flexible width to fill the row
- Height: auto based on content
- Padding: 16px
- Gap between cards: 16px

## Task 10: Responsive Layout Adjustments

The profile page has a lot of content. Ensure it scrolls smoothly and each section is easy to find.

Desktop (1024px+):
- Personal details: 2-column layout (label left, value right)
- Theme cards: 3 in a row
- Font size buttons: horizontal row
- Toggle switches: full-width rows

Tablet (768px–1023px):
- Personal details: 2-column layout
- Theme cards: 3 in a row (smaller)
- Everything else same as desktop

Mobile (below 768px):
- Personal details: stacked (label above value)
- Theme cards: stacked vertically (1 per row)
- Font size buttons: horizontal row (they are small enough)
- Toggle switches: full-width rows
- Change password form: full-width
- Section headings: font-size-lg instead of font-size-xl to save space

Add a sticky section navigation on desktop (optional enhancement):
- Small sidebar or floating nav showing: Personal Details, Security, Notifications, Appearance, Account
- Clicking a section name scrolls to that section
- Current section highlighted based on scroll position (intersection observer)

</tasks>

<accessibility_requirements>
- Page heading: h1 "My Profile"
- Each section heading: h2 with appropriate icon (aria-hidden on decorative icons)
- Personal details: use description list (dl/dt/dd) for field label-value pairs
- Phone number mask: aria-label="Phone number ending in 5678" (do not read out asterisks)
- Change password section: aria-expanded on the collapsible header
- Password fields: same accessibility as Phase 1.3 (labels, aria-describedby for errors, show/hide toggle aria-label)
- Toggle switches: role="switch", aria-checked, aria-label, keyboard operable (Space/Enter)
- Saved indicator: aria-live="polite" announcing "Preference saved"
- Warning modal for disabling important notifications: role="alertdialog"
- Theme cards: role="radiogroup" on container, role="radio" on each card, aria-checked
- Font size buttons: role="radiogroup" on container, role="radio" on each button, aria-checked
- Live preview text: aria-live="polite" so changes are announced
- Log out all devices modal: role="alertdialog", focus trapped
- Section navigation (if implemented): role="navigation", aria-label="Profile sections"
- All form errors: aria-live="assertive"
- Loading skeletons: aria-hidden="true"
- Collapsible sections: aria-controls linking header to content panel
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── profile.ts                     (new — profile API functions)
│   └── mocks/
│       └── profile.ts                 (new — mock profile data and functions)
├── components/
│   ├── profile/
│   │   ├── PersonalDetails.tsx        (new — read-only personal info display)
│   │   ├── ChangePassword.tsx         (new — collapsible password change form)
│   │   ├── NotificationPreferences.tsx (new — toggle switches for email prefs)
│   │   ├── AppearanceSettings.tsx     (new — theme cards + font size selector)
│   │   ├── AccountActions.tsx         (new — log out all devices + data export)
│   │   └── ThemeCard.tsx              (new — individual theme preview card)
│   └── ui/
│       └── ToggleSwitch.tsx           (new — reusable toggle switch component)
├── pages/
│   └── Profile.tsx                    (updated from placeholder)
├── types/
│   └── profile.ts                     (new — profile-related types)
└── App.tsx                            (unchanged)
```
</files_expected>

<test_scenarios>
**Personal Details:**
1. Profile page loads → personal details show Sarah Mitchell's information
2. Full name: "Sarah Mitchell", DOB: "14 March 1988", email: "client@test.com"
3. Phone number masked: "*******5678"
4. Client ID shown in monospaced font
5. Member since date formatted correctly
6. "Active Claims" is a clickable link that navigates to /claims
7. Contact information shown with working mailto and tel links

**Change Password:**
8. Security section collapsed by default with "Password last changed: Never"
9. Click heading → section expands with smooth animation
10. Enter current password "Password1" + valid new password → success toast, section collapses
11. Enter wrong current password → inline error "Current password is incorrect"
12. New password same as current → error "New password must be different"
13. Password requirements checklist updates in real-time
14. Strength bar shows correct level
15. Confirm password mismatch → inline error
16. Cancel button → section collapses, fields cleared
17. After successful change → "Password last changed: today's date"

**Notification Preferences:**
18. All toggles loaded with correct initial state (all on except marketing)
19. Toggle statusChanges off → brief "Saved ✓" indicator appears, then fades
20. Toggle offerNotifications off → warning modal appears "you may miss important updates"
21. Click "Keep Enabled" on warning → toggle reverts to on
22. Click "Disable" on warning → toggle stays off, saved
23. Toggle paymentUpdates off → same warning behaviour
24. Rapidly toggle multiple preferences → changes batched, single API call after 500ms
25. If save fails (temporarily break mock) → toggle reverts, error toast shown

**Appearance — Theme:**
26. Three theme cards displayed with mini previews
27. Current theme card shows selected state (border + checkmark)
28. Click Dark theme card → entire app switches to dark theme instantly
29. Click High Contrast card → app switches, card shows selected
30. Click Light card → app switches back
31. Theme persists across page navigation and browser refresh

**Appearance — Font Size:**
32. Three font size buttons displayed
33. Current size shows selected state
34. Click "Large" → all text on the page (and app) scales up immediately
35. Preview text below updates to show the new size
36. Click "Extra Large" → further scaling
37. Font size persists across navigation and refresh

**Account Actions:**
38. "Log Out of All Devices" button → confirmation modal
39. Confirm → logged out, redirected to /login, toast shown
40. Cancel → modal closes, nothing happens
41. Data export request (if implemented) → confirmation, toast shown

**Responsive:**
42. Desktop (1024px+): 2-column personal details, 3 theme cards in a row
43. Tablet (768px): 2-column details, 3 smaller theme cards
44. Mobile (375px): stacked details, stacked theme cards, toggle rows fill width
45. Change password form fills width on mobile
46. All sections scrollable with clear separation

**Theming:**
47. Profile page renders correctly in all 3 themes (especially the theme cards showing correct previews)
48. Toggle switches visible in dark and high-contrast modes
49. Collapsible section borders and dividers visible in all themes

**Font Size:**
50. All profile sections scale correctly at Default, Large, and Extra Large
51. Toggle switch labels and descriptions remain readable at Extra Large
52. Theme cards remain proportional

**Accessibility:**
53. Tab through all interactive elements in logical order
54. Toggle switches operable with Space/Enter
55. Collapsible section: Enter/Space on heading toggles expansion
56. Theme cards: arrow keys navigate between options (radiogroup behaviour)
57. Screen reader announces toggle state changes
58. Screen reader announces "Saved" when preference saved
59. Warning modal traps focus
60. Phone number mask reads correctly via screen reader
</test_scenarios>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Personal details display all fields correctly with proper formatting
- [ ] Phone number masked showing only last 4 digits
- [ ] Active Claims links to /claims page
- [ ] Contact information has working mailto and tel links
- [ ] Change password section is collapsible (collapsed by default)
- [ ] Correct current password ("Password1") allows password change
- [ ] Wrong current password shows inline error
- [ ] Password requirements checklist and strength bar work (reused from Phase 1.3)
- [ ] Password last changed date updates after successful change
- [ ] Notification toggles load with correct initial state
- [ ] Toggle changes auto-save with "Saved ✓" indicator
- [ ] Warning shown when disabling critical notifications (offers, payments)
- [ ] Rapid toggles debounced to single API call
- [ ] Failed save reverts toggle and shows error toast
- [ ] Three theme preview cards with mini mockups of each theme
- [ ] Clicking a theme card applies it instantly across the entire app
- [ ] Three font size options with "Aa" previews
- [ ] Font size changes apply instantly with preview text
- [ ] Theme and font size persist in localStorage across sessions
- [ ] Toggle switch component is reusable with proper ARIA attributes
- [ ] Log out all devices shows confirmation and logs out on confirm
- [ ] All 3 themes render the profile page correctly
- [ ] All 3 font sizes scale the profile page correctly
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] All accessibility requirements met
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 5.1 completes the web app frontend. All client-facing pages are now built with mock data. The next phase (6.1) moves to the notification system — building email templates and an in-app notification feed. After that, Phase 7.1 replaces all mocks with real CRM API calls.
</notes_for_next_phase>
