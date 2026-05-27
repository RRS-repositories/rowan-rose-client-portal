# Rowan Rose Client Portal — Phase 1.2: Layout Shell & Navigation

<context>
Phase 1.1 is complete. The project has been scaffolded with React + TypeScript + Vite + Tailwind CSS. The design system is in place with ThemeProvider (Light, Dark, High Contrast), FontSizeProvider (Default, Large, Extra Large), and base UI components (Button, Card, Input, Badge, Spinner, SettingsPanel). The Stitch MCP design has been fetched and a DESIGN.md exists in the project root.

This is Phase 1.2. You are now building the application shell — the persistent layout that wraps every page. This includes the sidebar navigation, top header bar, responsive behaviour, and page routing. All pages will be empty placeholders for now — content comes in later phases.
</context>

<dependencies>
Install the following packages before starting:
- react-router-dom (v6+) — for client-side routing
- lucide-react — for navigation icons (consistent, accessible icon set)
</dependencies>

<tasks>

## Task 1: Top Header Bar

Create a `Header.tsx` component in `src/components/layout/` that spans the full width of the viewport above the main content area.

Header contents (left to right):
- Rowan Rose Solicitors logo placeholder (use a styled text logo for now: "Rowan Rose" in brand primary colour, bold, with a small rose icon from lucide-react or a simple SVG)
- Spacer pushing remaining items to the right
- Notification bell icon (Bell from lucide-react) with a red count badge showing unread count (hardcode to 3 for now). Badge should be a small red circle with white number positioned top-right of the bell icon
- User greeting: "Hi, Sarah" (hardcode for now) in text-secondary colour
- Settings gear icon (Settings from lucide-react) that opens the SettingsPanel from Phase 1.1 as a dropdown panel or modal

Header styling:
- Fixed to the top of the viewport (sticky)
- Height: 64px
- Background: var(--bg-secondary)
- Bottom border: 1px solid var(--border)
- Padding: 0 24px
- All items vertically centred
- Z-index high enough to sit above page content
- Must respect current theme and font size

Mobile (below 768px):
- Logo shortens to "RR" or just the icon
- User greeting hidden
- Bell and settings icons remain

## Task 2: Sidebar Navigation

Create a `Sidebar.tsx` component in `src/components/layout/` with vertical navigation links.

Navigation items (top to bottom):
| Label | Icon (lucide-react) | Route |
|-------|---------------------|-------|
| Dashboard | LayoutDashboard | /dashboard |
| My Claims | FileText | /claims |
| Documents | Upload | /documents |
| Messages | MessageSquare | /messages |
| Profile | User | /profile |

Sidebar styling:
- Fixed to the left side of the viewport, below the header
- Width: 260px on desktop
- Background: var(--bg-secondary)
- Right border: 1px solid var(--border)
- Full remaining height (100vh minus header height)
- Navigation items stacked vertically with 4px gap
- Each nav item: 48px height, 16px horizontal padding, 8px border-radius, icon + label in a row with 12px gap
- Default state: text-secondary colour, transparent background
- Hover state: bg-tertiary background
- Active/current route state: brand-primary background with white text, or brand-primary text with a subtle brand-primary background tint (match the Stitch design)
- Smooth transition on hover and active states (150ms)
- Each nav item must be a proper anchor/link (not just a div) for accessibility
- Focus visible outline on keyboard navigation

Bottom of sidebar:
- A "Log Out" item (LogOut icon from lucide-react) separated from the main nav by a spacer or divider line
- Styled differently (text-muted colour, no active state)
- Clicking it does nothing for now (will be connected in Phase 1.4)

Sidebar footer:
- Small text at the very bottom: "© 2026 Rowan Rose Solicitors" in text-muted, font-size-xs

## Task 3: Mobile Navigation

On viewports below 768px, the sidebar transforms into a bottom tab bar.

Bottom tab bar:
- Fixed to the bottom of the viewport
- Height: 64px (plus safe area inset for notched phones using env(safe-area-inset-bottom))
- Background: var(--bg-secondary)
- Top border: 1px solid var(--border)
- 5 tabs equally spaced: Dashboard, My Claims, Documents, Messages, Profile
- Each tab: icon above label, both centred vertically
- Label font size: font-size-xs
- Active tab: brand-primary colour for icon and label
- Inactive tabs: text-muted colour
- No sidebar visible on mobile — it is completely hidden

Mobile header adjustments:
- Add a hamburger menu icon (Menu from lucide-react) on the left side of the header
- Tapping hamburger opens the full sidebar as an overlay panel sliding in from the left
- Overlay has a semi-transparent dark backdrop (clicking backdrop closes the sidebar)
- Sidebar overlay includes all nav items plus the Log Out button
- Close button (X icon) at top right of the overlay sidebar
- Transition: slide in from left, 200ms ease

Tablet (768px to 1023px):
- Sidebar collapses to icon-only mode (48px width, only icons visible, no labels)
- Hovering the collapsed sidebar expands it temporarily to full 260px width showing labels
- No bottom tab bar on tablet

## Task 4: Page Layout Wrapper

Create a `Layout.tsx` component in `src/components/layout/` that combines the Header, Sidebar/BottomTabBar, and a main content area.

Layout structure:
```
┌─────────────────────────────────────────────┐
│                  Header                      │
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │          Main Content             │
│          │          (React Router Outlet)     │
│          │                                   │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

Main content area:
- Takes up remaining width after sidebar
- Scrollable independently (overflow-y: auto)
- Padding: 32px on desktop, 24px on tablet, 16px on mobile
- Max content width: 1200px, centred horizontally with auto margins on very wide screens
- Minimum height: fills remaining viewport height
- Background: var(--bg-primary)

The Layout component wraps all authenticated pages. Login and registration pages do NOT use this layout (they have their own full-screen layout).

## Task 5: Routing Setup

Configure React Router in `App.tsx` with the following route structure:

```
/                     → Redirect to /dashboard
/dashboard            → Dashboard page (placeholder)
/claims               → Claims list page (placeholder)
/claims/:id           → Claim detail page (placeholder)
/documents            → Documents page (placeholder)
/messages             → Messages page (placeholder)
/messages/:claimId    → Messages for specific claim (placeholder)
/profile              → Profile page (placeholder)
/login                → Login page (placeholder, outside Layout)
/register             → Registration page (placeholder, outside Layout)
/forgot-password      → Forgot password page (placeholder, outside Layout)
/reset-password       → Reset password page (placeholder, outside Layout)
/verify-otp           → OTP verification page (placeholder, outside Layout)
/*                    → 404 Not Found page
```

Route organisation:
- Auth routes (/login, /register, /forgot-password, /reset-password, /verify-otp) render WITHOUT the Layout wrapper — full-screen pages
- All other routes render INSIDE the Layout wrapper with Header + Sidebar
- No route protection yet (no auth guards) — that comes in Phase 1.4

## Task 6: Placeholder Pages

Create placeholder pages in `src/pages/` for every route. Each placeholder should be a simple component showing:
- Page title in a heading (e.g. "Dashboard", "My Claims", "Documents")
- Subtitle text: "This page will be built in Phase X.X"
- An appropriate icon from lucide-react matching the nav item
- Centred in the content area, using theme colours

Placeholder pages needed:
- Dashboard.tsx — "Coming in Phase 1.5"
- Claims.tsx — "Coming in Phase 1.5"
- ClaimDetail.tsx — "Coming in Phase 1.6"
- Documents.tsx — "Coming in Phase 2.1"
- Messages.tsx — "Coming in Phase 3.1"
- Profile.tsx — "Coming in Phase 5.1"
- Login.tsx — "Coming in Phase 1.3"
- Register.tsx — "Coming in Phase 1.3"
- ForgotPassword.tsx — "Coming in Phase 1.4"
- ResetPassword.tsx — "Coming in Phase 1.4"
- VerifyOtp.tsx — "Coming in Phase 1.3"
- NotFound.tsx — "Page not found. Return to Dashboard" with a link back to /dashboard

## Task 7: 404 Page

The NotFound page should be more polished than other placeholders:
- Large "404" text
- "Page not found" message
- "The page you are looking for does not exist or has been moved."
- A Button component (from Phase 1.1) linking back to /dashboard: "Back to Dashboard"
- Centred on screen, works with all themes

## Task 8: Settings Integration

The settings gear icon in the Header should open the SettingsPanel (built in Phase 1.1) as a dropdown or slide-out panel:
- Clicking the gear icon toggles the panel open/closed
- Panel appears below the gear icon (dropdown style) or slides in from the right edge
- Panel has a subtle shadow and border
- Clicking outside the panel closes it
- Pressing Escape closes it
- Focus is trapped inside the panel when open (accessibility)
- Theme and font size changes still apply instantly and persist in localStorage

</tasks>

<responsive_breakpoints>
| Breakpoint | Layout Behaviour |
|-----------|-----------------|
| Below 768px (Mobile) | Bottom tab bar, no sidebar, hamburger menu opens sidebar overlay, reduced padding |
| 768px to 1023px (Tablet) | Collapsed icon-only sidebar (48px), expands on hover, no bottom tab bar |
| 1024px and above (Desktop) | Full 260px sidebar with labels, no bottom tab bar |
</responsive_breakpoints>

<accessibility_requirements>
- All navigation links must be proper anchor elements or have role="link"
- Active route announced to screen readers (aria-current="page")
- Sidebar overlay must trap focus when open
- Escape key closes sidebar overlay and settings panel
- Skip navigation link as the very first focusable element: "Skip to main content" — visually hidden until focused, jumps focus to main content area
- All icons must have aria-label or be aria-hidden with adjacent visible text
- Notification badge must have aria-label (e.g. "3 unread notifications")
- Bottom tab bar items must have aria-label matching their function
- Hamburger menu button: aria-expanded="true/false", aria-label="Open navigation menu"
- Keyboard navigation: Tab through all nav items, Enter/Space to activate
- Focus ring visible on all interactive elements using var(--border-focus)
</accessibility_requirements>

<files_expected>
```
src/
├── components/
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── BottomTabBar.tsx
│       ├── MobileDrawer.tsx      (sidebar overlay for mobile)
│       ├── Layout.tsx            (main wrapper combining all)
│       └── SkipLink.tsx          (skip to main content)
├── pages/
│   ├── Dashboard.tsx
│   ├── Claims.tsx
│   ├── ClaimDetail.tsx
│   ├── Documents.tsx
│   ├── Messages.tsx
│   ├── Profile.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── VerifyOtp.tsx
│   └── NotFound.tsx
├── App.tsx                       (updated with routing)
└── main.tsx                      (updated with BrowserRouter)
```
</files_expected>

<acceptance_criteria>
- [ ] npm run dev starts without errors
- [ ] Navigating between all routes works via sidebar/tab bar clicks
- [ ] Active route is visually highlighted in the sidebar and bottom tab bar
- [ ] URL updates correctly when navigating
- [ ] Browser back/forward buttons work correctly
- [ ] Header is sticky and visible at all times during scroll
- [ ] Sidebar is visible at 1024px+ with full labels
- [ ] Sidebar collapses to icon-only at 768px–1023px and expands on hover
- [ ] Bottom tab bar appears below 768px, sidebar is completely hidden
- [ ] Hamburger menu opens sidebar overlay on mobile with backdrop
- [ ] Clicking backdrop or X button closes the mobile sidebar overlay
- [ ] Escape key closes mobile sidebar overlay
- [ ] Escape key closes settings dropdown
- [ ] Settings panel opens from gear icon and theme/font changes work
- [ ] Skip navigation link is first focusable element and works correctly
- [ ] All interactive elements have visible focus rings with keyboard navigation
- [ ] Notification badge shows "3" with proper aria-label
- [ ] 404 page renders for unknown routes with link back to dashboard
- [ ] All placeholder pages render correctly with their phase reference
- [ ] All themes (Light, Dark, High Contrast) apply correctly to the layout shell
- [ ] All font sizes (Default, Large, Extra Large) scale the navigation text correctly
- [ ] Layout looks correct at 375px, 768px, 1024px, and 1440px viewports
- [ ] No TypeScript errors
- [ ] No console warnings or errors
</acceptance_criteria>

<notes_for_next_phase>
Phase 1.3 will build the Registration flow (registration form, OTP verification, create password, success page) using the auth route placeholders created here. The Layout wrapper and navigation will not be used on auth pages — they have their own full-screen layout.
</notes_for_next_phase>
