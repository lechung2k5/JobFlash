---
name: Tím Đỏ Electric Glass
colors:
  surface: '#fef7ff'
  surface-dim: '#e1d5f2'
  surface-bright: '#fef7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1ff'
  surface-container: '#f4eaff'
  surface-container-high: '#efe3ff'
  surface-container-highest: '#eaddfb'
  on-surface: '#1f182d'
  on-surface-variant: '#4c4355'
  inverse-surface: '#342d43'
  inverse-on-surface: '#f7edff'
  outline: '#7e7386'
  outline-variant: '#cfc2d7'
  surface-tint: '#8420df'
  primary: '#6f00c5'
  on-primary: '#ffffff'
  primary-container: '#8b2ce6'
  on-primary-container: '#f0dcff'
  inverse-primary: '#dbb8ff'
  secondary: '#b5005c'
  on-secondary: '#ffffff'
  secondary-container: '#df1875'
  on-secondary-container: '#fffbff'
  tertiary: '#4632c0'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f4ed9'
  on-tertiary-container: '#e4dfff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efdbff'
  primary-fixed-dim: '#dbb8ff'
  on-primary-fixed: '#2b0052'
  on-primary-fixed-variant: '#6700b6'
  secondary-fixed: '#ffd9e1'
  secondary-fixed-dim: '#ffb1c6'
  on-secondary-fixed: '#3f001c'
  on-secondary-fixed-variant: '#8e0047'
  tertiary-fixed: '#e4dfff'
  tertiary-fixed-dim: '#c6bfff'
  on-tertiary-fixed: '#160066'
  on-tertiary-fixed-variant: '#4029ba'
  background: '#fef7ff'
  on-background: '#1f182d'
  surface-variant: '#eaddfb'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system pairs an iOS-native structural discipline with high-energy violet and magenta hues. It manifests an ethereal yet precise aesthetic: clean, light-reflective canvas planes layered with frosted glass, high-contrast modern typography, and kinetic gradients.

Targeted at modern, mobile-first lifestyle, fintech, and creative applications, the interface evokes clarity, technological confidence, and sensory tactility. Glass panels provide depth without clutter, capturing light and tinting background luminance while maintaining rigorous usability.

## Colors
The palette balances an electric spectrum against pure, airy surfaces:
- **Primary Violet (`#8B2CE6`)**: Anchor for key actions, brand marks, and active state indicators.
- **Secondary Magenta (`#E01A76`)**: High-voltage accent used in linear gradients, promotional badges, and vibrant active states.
- **Tertiary Indigo (`#6C5CE7`)**: Calming companion for secondary visual hierarchy, auxiliary graphs, and pill fills.
- **Neutral Dark (`#1D162B`)**: Deep purple-cast ink ensuring crisp typographic legibility across light backgrounds.

### Surfaces & Gradients
- **Canvas Base**: `#FFFFFF` to `#F8F6FC` neutral gradient foundation.
- **Electric Accent Gradient**: Linear `135deg` from `#8B2CE6` (Primary) to `#E01A76` (Secondary).
- **Frosted Glass Fill**: `rgba(255, 255, 255, 0.72)` paired with `rgba(255, 255, 255, 0.4)` borders.

## Typography
Plus Jakarta Sans delivers structural geometry with humanized curves, aligning with iOS typographic ergonomics. 

- **Display & Headlines**: Tightly tracked (`-0.02em` to `-0.03em`) with high weight contrast to ground translucent glass containers.
- **Body & Labels**: Emphasizes optical balance at small sizes with open counters and balanced ascenders to preserve clarity against ambient light gradients.

## Layout & Spacing
A flexible 4pt baseline grid structures layouts across dynamic screen factors:
- **Mobile (< 768px)**: Fluid 4-column layout with `1rem` margins and `1rem` gutters. Elements stack vertically, using edge-to-edge frosted sheets with inset padding.
- **Tablet (768px - 1024px)**: 8-column layout accommodating modular card clusters with `1.5rem` margins.
- **Desktop (> 1024px)**: 12-column layout capped at a maximum width of `1280px`, surrounded by `2.5rem` outer canvas margins and `1.5rem` gutters.

## Elevation & Depth
Depth is produced through translucent layering, backdrop blur filters, and tinted ambient drop shadows rather than heavy opaque elevation.

- **Base Layer (Level 0)**: Pristine background, tinted `#F8F6FC` with soft violet-rose circular gradient blooms (`opacity: 0.25; filter: blur(80px)`).
- **Glass Sheet (Level 1)**: `backdrop-filter: blur(20px) saturate(180%); background: rgba(255, 255, 255, 0.72); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 8px 32px -4px rgba(139, 44, 230, 0.08), 0 2px 8px -1px rgba(29, 22, 43, 0.04)`.
- **Floating Modals & Flyouts (Level 2)**: `backdrop-filter: blur(28px) saturate(190%); background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 16px 48px -8px rgba(139, 44, 230, 0.16), 0 4px 16px -2px rgba(224, 26, 118, 0.08)`.
- **Inner Rim Lighting**: All elevated panels feature a subtle `inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)` highlight on the top edge to simulate physical beveled glass.

## Shapes
The shape language implements Level 3 roundedness (Pill-shaped) with iOS-style continuous curvature (squircle-like feel):
- **Base Components (Controls, Chips, Inputs)**: `1rem` (16px) or full continuous pill (`9999px`).
- **Cards & Surface Containers**: `rounded-lg` (`2rem` / 32px).
- **Modals & Hero Sheets**: `rounded-xl` (`3rem` / 48px).

## Components

### Buttons
- **Primary**: Full pill radius (`9999px`), gradient fill `linear-gradient(135deg, #8B2CE6, #E01A76)`, high-contrast white text, subtle magenta glow shadow (`0 8px 24px -4px rgba(224, 26, 118, 0.35)`). Active state reduces scale to `0.98`.
- **Glass / Secondary**: Frosted white panel (`rgba(255, 255, 255, 0.7)`), 1px solid white border, Primary Violet text, soft ambient shadow.

### Chips & Badges
- **Status Chips**: Pill shape (`9999px`), height `32px`, horizontal padding `12px`. Light translucent purple fill (`rgba(139, 44, 230, 0.08)`) with saturated violet typography and optional leading circular indicator.
- **Electric Micro-Badges**: Height `20px`, typography `label-sm`, vivid magenta or violet solid backgrounds for counters and notification alerts.

### Cards
- **Glass Container**: 32px rounded corners, translucent backdrop blur, top rim highlight (`inset 0 1px 1px rgba(255,255,255,0.9)`), exterior diffused violet tint shadow. 
- **Content Flow**: 24px internal padding (`space-lg`), generous breathing room separating headings from actions.

### Input Fields
- **Container**: Continuous pill or 16px rounded rect, frosted background (`rgba(255, 255, 255, 0.6)`), 1px neutral/border line (`rgba(29, 22, 43, 0.08)`).
- **Focus State**: White glass fill (`rgba(255, 255, 255, 0.95)`), 1.5px border colored `#8B2CE6`, soft violet outer ring blur (`0 0 0 4px rgba(139, 44, 230, 0.15)`).

### Checkboxes & Radio Buttons
- **Checkboxes**: 20px box with `6px` radius. Active state fills with the primary gradient and an iOS-style white checkmark.
- **Radio Buttons**: 20px circular pill with smooth inset glass indent. Active state exhibits an electric magenta-to-violet center bead with subtle ambient glow.

### Lists & Segmented Controls
- **Segmented Controls**: Inset glass tray (`rgba(0, 0, 0, 0.04)`) with pill-shaped sliding thumb (`background: #FFFFFF`, crisp drop shadow: `0 2px 8px rgba(0,0,0,0.08)`).
- **List Rows**: Separated by ultra-thin hairline dividers (`rgba(29, 22, 43, 0.06)`), chevron glyphs tinted in secondary violet.