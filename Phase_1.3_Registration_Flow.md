# Rowan Rose Client Portal — Phase 1.3: Authentication — Registration Flow

<context>
Phase 1.1 (design system, theming, base components) and Phase 1.2 (layout shell, sidebar, header, routing, placeholder pages) are complete. The project has a working React + TypeScript app with navigation, responsive layout, and all routes configured.

This is Phase 1.3. You are building the full client registration flow. Registration pages use their OWN full-screen layout — they do NOT use the sidebar/header Layout wrapper from Phase 1.2. Auth pages have a clean, centred layout with the Rowan Rose logo at the top.

The registration flow matches the existing CRM system at Rowan Rose Solicitors. New clients register by providing their details, which are matched against the CRM database. Identity is verified via a one-time PIN (OTP) sent to their registered phone number via Twilio/Zapier. After verification, the client creates a password and gains access to the portal.

All API calls will be MOCKED in this phase. Real API integration comes in Phase 7.1.
</context>

<registration_flow_overview>
The registration is a 4-step linear flow. The client progresses through each step in order and cannot skip steps.

Step 1: Enter Details → Step 2: Verify OTP → Step 3: Create Password → Step 4: Success

A step indicator should be visible at the top of each page showing progress through all 4 steps.
</registration_flow_overview>

<tasks>

## Task 1: Auth Layout Wrapper

Create an `AuthLayout.tsx` component in `src/components/layout/` that wraps all authentication pages (registration, login, forgot password, reset password, OTP verification).

AuthLayout structure:
- Full-screen centred layout (no sidebar, no header bar)
- Background: var(--bg-primary) with a subtle pattern or gradient using brand colours (very faint)
- Centred card/container: max-width 480px, var(--bg-secondary) background, rounded corners (12px), subtle shadow, padding 40px (32px on mobile)
- Rowan Rose logo placeholder at the top centre of the card (styled text: "Rowan Rose Solicitors" in brand-primary colour, or use the logo from DESIGN.md)
- Below the card: a small footer text "© 2026 Rowan Rose Solicitors" in text-muted
- Fully responsive: card takes full width on mobile with 16px horizontal margin
- Theme and font size settings still apply (the ThemeProvider and FontSizeProvider wrap the entire app including auth pages)
- A small gear icon in the top-right corner of the screen for accessing the SettingsPanel (theme/font size switching) — users may need to increase font size before they even log in

## Task 2: Step Indicator Component

Create a `StepIndicator.tsx` component in `src/components/ui/` that shows the current step in a multi-step flow.

Props:
- steps: string[] — array of step labels (e.g. ["Details", "Verify", "Password", "Done"])
- currentStep: number — zero-indexed current step

Display:
- Horizontal row of circles connected by lines
- Each circle shows the step number (1, 2, 3, 4)
- Completed steps: brand-primary background, white number, checkmark instead of number
- Current step: brand-primary border, brand-primary number, slightly larger or pulsing
- Future steps: border colour var(--border), text-muted number
- Connecting lines: solid brand-primary for completed connections, dashed var(--border) for future
- Step labels below each circle in font-size-xs
- On mobile (below 480px): hide labels, show only circles and lines to save space
- Accessible: aria-label on the container describing progress (e.g. "Step 2 of 4: Verify")

## Task 3: Registration Page — Step 1 (Enter Details)

Route: /register
File: Update `src/pages/Register.tsx` (replace the placeholder)

Page content inside the AuthLayout card:
- Heading: "Create Your Account" in font-size-2xl
- Subheading: "Enter your details below. We will match them against our records." in text-secondary
- StepIndicator showing step 1 of 4

Form fields (all required):
1. **First Name** — text input, label "First Name", placeholder "Enter your first name", validation: minimum 2 characters, letters and hyphens only
2. **Last Name** — text input, label "Last Name", placeholder "Enter your last name", validation: minimum 2 characters, letters and hyphens only
3. **Date of Birth** — date input, label "Date of Birth", validation: must be 18 years or older (calculate from today's date), must not be a future date, must not be over 120 years ago
4. **Email Address** — email input, label "Email Address", placeholder "Enter your email address", validation: valid email format

Validation behaviour:
- Validate each field on blur (when the user leaves the field)
- Show inline error messages below the field using the Input component's error prop
- All error messages in red, associated with the field via aria-describedby
- Submit button disabled until all fields are filled (not necessarily valid — let them attempt submission to see errors)

Submit button:
- Full-width primary Button: "Continue"
- On click: validate all fields, if any errors exist show them and do not submit
- If all valid: show loading state on button (spinner + "Checking your details..."), call the mock API

Link below the form:
- "Already have an account? Log in" — links to /login

Mock API call (POST /auth/register):
Create a mock function in `src/api/mocks/auth.ts`:

```typescript
interface RegisterRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
}

interface RegisterResponse {
  matched: boolean;
  phoneLastFour: string;
  message: string;
}
```

Mock behaviour:
- Simulate a 1.5 second delay
- If email is "notfound@test.com" → return { matched: false, phoneLastFour: "", message: "We could not find an account matching these details. Please check your information or contact us." }
- For any other email → return { matched: true, phoneLastFour: "7890", message: "Details matched. OTP sent to registered phone number." }

On success (matched: true):
- Store the registration data temporarily (React state or sessionStorage)
- Navigate to /verify-otp
- Pass the phoneLastFour value to the OTP page (via route state or context)

On failure (matched: false):
- Show an error banner at the top of the form with the message from the response
- Error banner: red/brand-accent background with white text, dismiss button (X)

## Task 4: OTP Verification Page — Step 2

Route: /verify-otp
File: Update `src/pages/VerifyOtp.tsx`

If the user navigates directly to /verify-otp without completing Step 1, redirect them back to /register.

Page content:
- Heading: "Verify Your Identity"
- Subheading: "We have sent a 6-digit code to your phone number ending in ****{phoneLastFour}." in text-secondary
- StepIndicator showing step 2 of 4

OTP Input:
- 6 individual square input boxes in a horizontal row
- Each box accepts a single digit (0–9)
- Auto-advance: when a digit is typed, focus moves to the next box automatically
- Backspace: clears current box and moves focus to the previous box
- Paste support: if user pastes a 6-digit code, distribute digits across all boxes
- Each box: 48px width, 56px height (larger for older users), centred text, font-size-xl, border var(--border), border-radius 8px
- Current focus box: border-focus colour, subtle shadow
- Filled boxes: brand-primary border
- Error state: all boxes get red border

Timer:
- "Code expires in 4:59" countdown timer below the OTP boxes
- Starts at 5:00 minutes, counts down every second
- When it reaches 0:00, show "Code expired. Please request a new code." in red
- Format: M:SS

Resend Code:
- Below the timer: "Didn't receive the code? Resend" link
- "Resend" link is disabled for 30 seconds after sending (show countdown: "Resend in 28s")
- After 30 seconds, the link becomes active
- Clicking resend: calls mock API, resets the 5-minute timer, shows a brief success toast "New code sent"
- Maximum 3 resend attempts. After 3, show: "Maximum resend attempts reached. Please try again later or contact us." and disable the resend link permanently

Verify button:
- Full-width primary Button: "Verify"
- Disabled until all 6 digits are entered
- On click: show loading state, call mock API

Mock API call (POST /auth/verify-otp):
```typescript
interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface VerifyOtpResponse {
  verified: boolean;
  attemptsRemaining: number;
  token: string;
  message: string;
}
```

Mock behaviour:
- Simulate a 1 second delay
- If OTP is "123456" → return { verified: true, attemptsRemaining: 0, token: "mock-jwt-token-abc123", message: "Identity verified." }
- If OTP is anything else → return { verified: false, attemptsRemaining: (decrement from 5), token: "", message: "Incorrect code. X attempts remaining." }
- If attemptsRemaining reaches 0 → return { verified: false, attemptsRemaining: 0, token: "", message: "Too many incorrect attempts. Your account has been temporarily locked. Please try again in 15 minutes or contact us." }

On success (verified: true):
- Store the mock JWT token
- Navigate to /create-password

On failure (verified: false):
- Clear all OTP boxes
- Show error message below the boxes in red
- If locked out (attemptsRemaining: 0): disable the OTP input and verify button, show the lockout message

Back link:
- "Back to registration" link below the form — navigates back to /register

## Task 5: Create Password Page — Step 3

Route: /create-password (add this new route to the router in App.tsx)
File: Create `src/pages/CreatePassword.tsx`

If the user navigates directly without completing Steps 1 and 2, redirect to /register.

Page content:
- Heading: "Create Your Password"
- Subheading: "Choose a strong password for your account." in text-secondary
- StepIndicator showing step 3 of 4

Form fields:
1. **Password** — password input with show/hide toggle
   - Label: "Password"
   - Placeholder: "Create your password"
2. **Confirm Password** — password input with show/hide toggle
   - Label: "Confirm Password"
   - Placeholder: "Re-enter your password"
   - Validation: must match the password field exactly

Password requirements checklist (displayed below the password field, updates in real-time as user types):
- [ ] At least 8 characters — shows tick/check when met, cross/X when not
- [ ] At least one uppercase letter (A–Z)
- [ ] At least one lowercase letter (a–z)
- [ ] At least one number (0–9)

Each requirement:
- Default (unmet): text-muted colour, X icon
- Met: brand-primary/green colour, check icon
- All requirements use font-size-sm

Password strength indicator:
- A horizontal bar below the requirements checklist
- 4 segments that fill progressively:
  - 1 segment (red): Weak — less than 2 requirements met
  - 2 segments (orange): Fair — 2 requirements met
  - 3 segments (yellow-green): Good — 3 requirements met
  - 4 segments (green): Strong — all 4 requirements met
- Label text next to the bar: "Weak" / "Fair" / "Good" / "Strong"

Submit button:
- Full-width primary Button: "Create Account"
- Disabled until: all 4 password requirements are met AND both passwords match
- On click: show loading state, call mock API

Mock API call (POST /auth/create-password):
```typescript
interface CreatePasswordRequest {
  token: string;
  password: string;
}

interface CreatePasswordResponse {
  success: boolean;
  message: string;
}
```

Mock behaviour:
- Simulate a 1.5 second delay
- Always return { success: true, message: "Account created successfully." }

On success:
- Navigate to /registration-success

## Task 6: Registration Success Page — Step 4

Route: /registration-success (add this new route to the router)
File: Create `src/pages/RegistrationSuccess.tsx`

Page content:
- Large green checkmark icon (circle with check) centred at top
- Heading: "You're All Set!" in font-size-2xl
- StepIndicator showing step 4 of 4 (all completed)
- Message paragraph: "Your account has been created successfully. You can now log in to view your claims, upload documents, and track your progress." in text-secondary
- Full-width primary Button: "Go to Dashboard" — navigates to /dashboard (for now; will navigate to /login in Phase 1.4 when auth guards are in place)
- Below the button: "Need help? Contact us at support@rowanrose.co.uk" in text-muted with email as a mailto link

The success page should feel celebratory but professional — a subtle animation on the checkmark (fade in + scale up) adds a nice touch.

## Task 7: Registration State Management

Create a `RegistrationContext.tsx` in `src/context/` to manage state across the multi-step registration flow.

State to track:
```typescript
interface RegistrationState {
  step: number;                    // Current step (0-3)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneLastFour: string;
  otpToken: string;                // Temporary token from OTP verification
  otpAttemptsRemaining: number;
  resendAttemptsRemaining: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
}
```

Context functions:
- setRegistrationDetails(details) — store Step 1 data
- setOtpVerified(token) — store token from Step 2
- resetRegistration() — clear all state (used on completion or navigation away)
- decrementOtpAttempts() — track failed OTP attempts
- decrementResendAttempts() — track resend attempts

The context should be scoped to auth pages only — wrap the auth routes with RegistrationProvider. State is cleared when the user navigates away from the registration flow.

## Task 8: Mock API Service Layer

Create the mock API layer that all auth pages will use.

File structure:
```
src/
├── api/
│   ├── client.ts            # Base API client (axios/fetch wrapper, prepared for real APIs later)
│   ├── auth.ts              # Auth API functions (register, verifyOtp, createPassword)
│   └── mocks/
│       └── auth.ts          # Mock implementations with delays
```

`src/api/client.ts`:
- Create a base fetch/axios wrapper with: baseURL from environment variable (VITE_API_URL, default to ""), JSON content-type headers, error handling wrapper
- Export a function like `apiClient.post(url, data)` and `apiClient.get(url)`
- This will be swapped to real API calls in Phase 7.1

`src/api/auth.ts`:
- Export functions: `registerClient(data)`, `verifyOtp(data)`, `createPassword(data)`
- These functions currently import from mocks but are structured so the import can be swapped to real API calls later
- Add a flag or environment variable (VITE_USE_MOCKS=true) to toggle between mock and real

`src/api/mocks/auth.ts`:
- Contains all the mock implementations described in Tasks 3, 4, and 5
- Each mock uses a `delay(ms)` utility function that returns a Promise resolving after the specified milliseconds
- Mocks return typed responses matching the interfaces above

## Task 9: Form Validation Utilities

Create reusable validation utilities in `src/utils/validation.ts`:

```typescript
// Validates a name field (letters, hyphens, spaces, apostrophes, min 2 chars)
validateName(value: string): string | null

// Validates email format
validateEmail(value: string): string | null

// Validates date of birth (must be 18+, not future, not over 120 years)
validateDateOfBirth(value: string): string | null

// Validates password against all requirements, returns which requirements are met
validatePassword(value: string): {
  isValid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

// Validates confirm password matches
validatePasswordMatch(password: string, confirmPassword: string): string | null
```

Each validator returns null if valid, or an error message string if invalid. Error messages should be user-friendly and specific (not just "Invalid field").

## Task 10: Toast Notification System

Create a simple toast notification system for showing brief success/error messages.

`src/components/ui/Toast.tsx`:
- Small notification bar that slides in from the top-right
- Variants: success (green), error (red), info (blue), warning (amber)
- Auto-dismiss after 5 seconds
- Manual dismiss via X button
- Stacks if multiple toasts are active (newest on top)
- Accessible: role="alert" for errors, role="status" for success/info

`src/context/ToastContext.tsx`:
- Provides a `showToast(message, variant)` function
- Manages the toast queue/stack
- Wrap the entire app with ToastProvider

</tasks>

<routing_updates>
Update the router in App.tsx to add the new routes:

```
/register              → Register.tsx (Step 1)
/verify-otp            → VerifyOtp.tsx (Step 2)
/create-password       → CreatePassword.tsx (Step 3, NEW ROUTE)
/registration-success  → RegistrationSuccess.tsx (Step 4, NEW ROUTE)
```

All four routes use the AuthLayout wrapper, not the main Layout.
</routing_updates>

<test_scenarios>
After building, manually test these scenarios:

1. Happy path: Fill valid details → enter OTP "123456" → create valid password → see success page
2. Email not found: Use "notfound@test.com" → see error banner
3. Wrong OTP: Enter any code except "123456" → see error, attempts decrement
4. OTP lockout: Enter wrong OTP 5 times → see lockout message, inputs disabled
5. OTP expiry: Wait for timer to reach 0:00 → see expiry message
6. OTP resend: Click resend → see cooldown, then resend works, max 3 times
7. Weak password: Type "abc" → see requirements unchecked, strength bar red, button disabled
8. Password mismatch: Enter different passwords → see error on confirm field
9. Direct URL access: Navigate directly to /verify-otp → redirected to /register
10. Direct URL access: Navigate directly to /create-password → redirected to /register
11. Theme switching: Open settings, switch to dark/high-contrast → all auth pages render correctly
12. Font size switching: Switch to Extra Large → all form fields and text scale correctly
13. Mobile view: Resize to 375px → auth card fills width, OTP boxes fit, all content readable
</test_scenarios>

<accessibility_requirements>
- All form fields have associated labels (using htmlFor/id)
- Error messages linked via aria-describedby
- StepIndicator has aria-label describing current progress
- OTP inputs have aria-label (e.g. "Digit 1 of 6")
- Loading states announced via aria-live="polite"
- Error banner has role="alert"
- Toast notifications use appropriate ARIA roles
- All interactive elements keyboard navigable
- Tab order follows visual order
- Form can be submitted with Enter key
- Password show/hide toggle has aria-label ("Show password" / "Hide password")
</accessibility_requirements>

<files_expected>
```
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   └── mocks/
│       └── auth.ts
├── components/
│   ├── layout/
│   │   └── AuthLayout.tsx
│   └── ui/
│       ├── StepIndicator.tsx
│       └── Toast.tsx
├── context/
│   ├── RegistrationContext.tsx
│   └── ToastContext.tsx
├── pages/
│   ├── Register.tsx           (updated from placeholder)
│   ├── VerifyOtp.tsx          (updated from placeholder)
│   ├── CreatePassword.tsx     (new)
│   └── RegistrationSuccess.tsx (new)
├── utils/
│   └── validation.ts
└── App.tsx                    (updated with new routes)
```
</files_expected>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Registration page renders with all 4 form fields inside the AuthLayout
- [ ] Step indicator shows correct progress on each page
- [ ] Inline validation works on blur for all fields
- [ ] Date of birth rejects users under 18
- [ ] Email "notfound@test.com" shows error banner on registration page
- [ ] Any other email proceeds to OTP page with phone last 4 digits displayed
- [ ] OTP input has 6 individual boxes with auto-advance and paste support
- [ ] OTP "123456" passes verification and proceeds to create password
- [ ] Wrong OTP shows error and decrements remaining attempts
- [ ] 5 failed OTP attempts locks the user out
- [ ] OTP timer counts down from 5:00 and shows expiry message at 0:00
- [ ] Resend link is disabled for 30 seconds after sending
- [ ] Maximum 3 resend attempts enforced
- [ ] Password requirements checklist updates in real-time
- [ ] Password strength bar fills progressively
- [ ] Create Account button disabled until password is strong and both fields match
- [ ] Success page shows checkmark animation and "Go to Dashboard" button
- [ ] Navigating directly to /verify-otp or /create-password without Step 1 redirects to /register
- [ ] Toast notifications appear for resend OTP success
- [ ] Settings gear icon on auth pages allows theme and font size changes
- [ ] All auth pages render correctly in all 3 themes
- [ ] All auth pages render correctly at all 3 font sizes
- [ ] All auth pages are responsive at 375px, 768px, and 1024px+
- [ ] All form fields are keyboard accessible with proper tab order
- [ ] Screen reader announces errors and progress correctly
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 1.4 will build the Login page, Logout functionality, Password Reset flow, session management with auth context, protected route guards, and auto-logout after 30 minutes of inactivity. It will connect to the AuthLayout and mock API layer created in this phase.
</notes_for_next_phase>
