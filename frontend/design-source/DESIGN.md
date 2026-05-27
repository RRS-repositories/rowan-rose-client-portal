---
name: Modern Jurist
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#404944'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#5c5f62'
  on-secondary: '#ffffff'
  secondary-container: '#dee0e4'
  on-secondary-container: '#606366'
  tertiary: '#2a2f33'
  on-tertiary: '#ffffff'
  tertiary-container: '#40454a'
  on-tertiary-container: '#aeb2b8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#e0e2e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1f'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#dfe3e9'
  tertiary-fixed-dim: '#c3c7cd'
  on-tertiary-fixed: '#171c20'
  on-tertiary-fixed-variant: '#43474c'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 24px
---

## Brand & Style
The design system balances the authoritative weight of the UK legal sector with a tactile, approachable interface. It targets users navigating complex claims who require clarity, reassurance, and a sense of progress. 

The aesthetic is **Modern Skeuomorphism**. This style moves away from flat design by reintroducing physical affordances—depth, inner shadows, and subtle gradients—to make digital elements feel tangible and "clickable." The goal is to evoke a sense of high-end craftsmanship and institutional stability, utilizing soft surfaces that feel like physical stationery or premium hardware.

## Colors
The palette is rooted in a warm, "Pearl" off-white to reduce eye strain and provide a sophisticated alternative to pure white. The primary accent, **Deep Emerald**, provides the necessary gravity for a legal platform.

### Light Mode
- **Surface (Background):** #FDFCFB
- **Surface (Card):** Linear gradient from #FFFFFF to #F3F4F6.
- **Primary Action:** #064E3B (Deep Emerald) for high-contrast commitment.

### Dark Mode
- **Surface (Background):** #121212 (Ink)
- **Surface (Card):** Linear gradient from #1F2937 to #111827.
- **Accents:** Emerald values are brightened slightly for better visibility against dark backgrounds while maintaining AAA contrast.

### Accessibility
All text-to-background combinations are strictly vetted for WCAG AAA compliance (7:1 ratio).

## Typography
The system uses **Plus Jakarta Sans** for headings to achieve a refined, humanist aesthetic similar to GT Walsheim, providing a modern and friendly character. **Be Vietnam Pro** is used for body copy due to its exceptional legibility at 18px and above.

- **Legibility:** Minimum body size is 18px to ensure accessibility for all users.
- **Tone:** Plain English is mandatory. No legal jargon.
- **Hierarchy:** Large display titles use tight letter spacing for a punchy, editorial feel, while labels use expanded spacing for clarity.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width of 1280px. 

- **8px Rhythm:** All padding, margins, and component heights are multiples of 8px.
- **Touch Targets:** A strict 48x48px minimum hit area is enforced for all interactive elements, with at least 8px of separation between adjacent targets.
- **Breakpoints:**
  - **Mobile:** < 600px (1 column, 16px margins).
  - **Tablet:** 600px - 1024px (6 columns, 32px margins).
  - **Desktop:** > 1024px (12 columns, 64px margins).

## Elevation & Depth
Depth is the core of this design system, created through a multi-layered shadow technique:

1.  **Inner Highlight:** A 1px white (or light-tinted) inner shadow on the top edge of buttons and cards to simulate a physical bevel catching the light.
2.  **Object Shadow:** A 1px dark stroke/shadow for definition.
3.  **Soft Outer Shadow:** An 8px diffuse shadow for immediate lift.
4.  **Ambient Shadow:** A 24px wide, low-opacity shadow to ground the element in the 3D space.

**Glassmorphism:** Overlays and modals use a 20px backdrop blur with a 10% white tint and a subtle 1px "glass" border to maintain separation from the content below.

## Shapes
The shape language is "Soft Geometric." Rounded corners are used to communicate friendliness and safety.

- **Cards/Containers:** 16px (rounded-lg) for a substantial, sturdy feel.
- **Buttons/Inputs:** 8px (standard) for a precise, interactive look.
- **Milestones:** Fully rounded (pill) for status indicators to contrast against the rectangular structural elements.

## Components

### Buttons
Buttons must feel pressable. 
- **Resting State:** Features the top-edge highlight and soft outer shadows.
- **Active (Pressed) State:** The outer shadow disappears, and a subtle inner shadow is applied to the entire box, simulating physical depression.

### Milestone Badges
Dimensional badges used for tracking claim progress. They use 3D-tinted icons (using a slight color gradient within the icon itself) and a "recessed" background style to appear as if they are embedded into the card surface.

### Input Fields
Inputs use a "hollowed-out" effect with a subtle inner shadow on the top and left edges, making the field look like it sits below the surface of the card.

### Cards
Cards are the primary container. They use a very subtle vertical gradient (mist white to pale grey) to give a slightly curved, tactile appearance.

### Icons
Icons are not flat. They use two-tone colors or subtle 3D shading to align with the skeuomorphic depth of the UI.
