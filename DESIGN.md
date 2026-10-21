---
name: Verbalis
colors:
  surface: '#faf9fb'
  surface-dim: '#dbd9dc'
  surface-bright: '#faf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f5'
  surface-container: '#efedf0'
  surface-container-high: '#e9e8ea'
  surface-container-highest: '#e3e2e4'
  on-surface: '#1b1c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2f3032'
  inverse-on-surface: '#f2f0f3'
  outline: '#777586'
  outline-variant: '#c8c4d7'
  surface-tint: '#5246dc'
  primary: '#4233cc'
  on-primary: '#ffffff'
  primary-container: '#5b50e5'
  on-primary-container: '#e8e4ff'
  inverse-primary: '#c4c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#4c4f59'
  on-tertiary: '#ffffff'
  tertiary-container: '#646772'
  on-tertiary-container: '#e4e6f3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c4c0ff'
  on-primary-fixed: '#120068'
  on-primary-fixed-variant: '#3926c4'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#e0e2ef'
  tertiary-fixed-dim: '#c4c6d2'
  on-tertiary-fixed: '#181b24'
  on-tertiary-fixed-variant: '#434751'
  background: '#faf9fb'
  on-background: '#1b1c1e'
  surface-variant: '#e3e2e4'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  metric-display:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 48px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an environment of focused composure, analytical clarity, and intellectual confidence. Tailored for graduates and professionals preparing for high-stakes technical interviews, speech evaluations, and executive communication, the system avoids cartoonish gamification, loud streaks, or toy-like rewards.

The aesthetic fuses the rigorous utility of high-performance developer tools (Linear, Raycast) with the serene, tactile spaciousness of deliberate journaling tools (Notion, Opal). The experience feels like a quiet private coaching studio:
- **Calm Authority:** Understated contrast, surgical typographic hierarchy, and warm neutral canvases that eliminate cognitive noise during verbal practice.
- **Precision Feedback:** Real-time speech waveforms, articulation heatmaps, and metric scorecards communicated with crisp structural lines, subtle semantic indicators, and zero decorative fluff.
- **Atmospheric Focus:** The AI interface is grounded by subtle, rhythmic luminescence—soft radial glows and restrained reactive orbs that indicate listening, processing, and evaluation states without jarring interruptions.

## Colors

The color palette centers on warm bone canvases and ink-toned charcoal text, accented by deep electric indigo and atmospheric soft lavender. Colors are applied functionally: the primary indigo denotes core interactions, intelligent system states, and active voice flows; semantic tones are restrained solely to performance diagnostics.

### Light Canvas (Primary Mode)
- **Canvas Base:** `#FBFBFA` (warm studio neutral)
- **Surface Level 1 (Cards, sheets):** `#FFFFFF`
- **Surface Level 2 (Inset inputs, pills):** `#F5F5F3`
- **Surface Level 3 (Hover, pressed state):** `#EEF0ED`
- **Border Default:** `#E5E7EB` (crisp 1px hair-line)
- **Border Subdued:** `#F0F1F3`
- **Text Primary:** `#1C1D1F`
- **Text Secondary:** `#6B7280`
- **Text Tertiary / Muted:** `#9CA3AF`

### Accents & AI State
- **Brand Primary:** `#5B50E5` (deep focused indigo)
- **Brand Secondary:** `#6366F1` (interactive violet)
- **Brand Tint Soft:** `#EEF0FD` (selection containers, transcription highlights)
- **Brand Tint Muted:** `#F4F5FC` (inactive voice containers)
- **Orb Radial Highlights:** Gradient stop from `#5B50E5` through `#818CF8` fading into `#EEF0FD00`

### Semantics & Feedback
- **Success / Fluency Pass:** `#10B981` (tint: `#ECFDF5`, border: `#A7F3D0`)
- **Caution / Filler Word Alert:** `#F59E0B` (tint: `#FFFBEB`, border: `#FDE68A`)
- **Critical / Grammar Breakdown:** `#EF4444` (tint: `#FEF2F2`, border: `#FECACA`)

### Dark Mode Tokens (Nocturnal Rehearsals)
- **Dark Canvas Base:** `#0F1012`
- **Dark Surface Level 1:** `#18191C`
- **Dark Surface Level 2:** `#222429`
- **Dark Border Default:** `#2D3037`
- **Dark Text Primary:** `#F3F4F6`
- **Dark Text Secondary:** `#9CA3AF`
- **Dark Accent Primary:** `#6366F1`
- **Dark Accent Tint Soft:** `#1E1E38`

## Typography

Typography relies entirely on the neutral, engineered clarity of Inter (or system-native San Francisco / Roboto on React Native). The hierarchy balances high-density data analytics (words-per-minute, cadence variance, filler word ratio) with generous, distraction-free reading comfort for speech scripts.

- **Headline Hierarchy:** Kept tight and intentional. Titles use negative letter spacing (`-0.02em` to `-0.015em`) with semi-bold weights to avoid ungrounded visual weight.
- **Body Text:** Standard body scales prioritize legible reading during real-time speech prompting. Optical sizing and open line heights prevent eye fatigue during conversational practice.
- **Metrics & Numbers:** Number readouts utilize tabular lining figures (`font-variant-numeric: tabular-nums;`) ensuring data-heavy rubrics, timers, and confidence percentages align without layout jitter.
- **Pill & Meta Labels:** Compact, uppercase or title-cased labels operate with slightly widened tracking (`+0.02em`) to maintain sharp readability on small screen viewports.

## Layout & Spacing

The layout is built for native mobile touch targets and standard React Native flexbox execution, ensuring fluidity across small iOS/Android devices up to tablet rehearsal dashboards.

### Mobile Grid & Safety
- **Outer Canvas Margins:** 20px (`1.25rem`) fixed gutter from device screen edge.
- **Vertical Safe Areas:** Dynamic integration with native safe-area insets (`react-native-safe-area-context`). Header blocks align to 56px heights; bottom interaction zones retain 24px clearance above home indicators.
- **Card-to-Card Stacking:** Continuous vertical lists adhere to 12px or 16px gaps, preserving rhythm without fracturing context.

### Responsive Behavior
- **Mobile Handsets (&lt; 600px):** Single-column stacked layouts. All conversational prompts, waveform visualizers, and interactive controls are fixed to the primary thumb zone (bottom 40% of the viewport).
- **Tablet / Large Formats (&ge; 600px):** Two-column split layout. The left rail houses the active speech teleprompter or conversational AI partner, while the right panel renders real-time acoustic analytics, filler detection, and pronunciation cues.

## Elevation & Depth

This system avoids heavy drop shadows and faux skeuomorphic bevels. Depth is articulated via **structural layering, micro-hairline borders, and soft ambient luminescence**.

1. **Base Layer (Canvas):** `#FBFBFA` provides a warm, non-reflective base sheet.
2. **Surface Layer (Cards & Panels):** Pure `#FFFFFF` resting on the canvas, bounded by a 1px boundary border of `#E5E7EB`.
3. **Floating Overlays (Bottom Sheets, Popovers):** Elevated via an ultra-subtle, warm ambient shadow:
   - `box-shadow: 0 8px 30px rgba(28, 29, 31, 0.04), 0 1px 3px rgba(28, 29, 31, 0.02);`
4. **Active Speech Orb & Voice Focus:** AI listening states produce a diffused, non-invasive back-glow:
   - Ambient glow: `box-shadow: 0 0 64px rgba(91, 80, 229, 0.18);`
5. **Dark Mode Depth:** Pure surface differentiation using progressively lightened dark neutrals (`#0F1012` &rarr; `#18191C` &rarr; `#222429`) coupled with 1px `#2D3037` outlines. Shadows are completely disabled in dark mode.

## Shapes

The shape vocabulary employs modern, friendly squircle curvature that feels ergonomic in hand without drifting into child-oriented or overly bubbly forms.

- **Primary Cards & Containers:** 16px (`1rem`) to 20px corner radii for structured content cards, interview rubric modules, and analysis panels.
- **Interactive Action Buttons:** 12px to 14px radii for clean geometric touch points.
- **Pills, Audio Meters, and Voice Targets:** Full circular pills (`border-radius: 9999px`) for contextual tags, session timers, mic triggers, and segment selectors.
- **React Native Implementation:** Apply `overflow: 'hidden'` and continuous smoothing (`curve: 'continuous'`) on iOS where available to preserve organic corners.

## Components

### Buttons & Voice Triggers
- **Primary Action Button:** 52px height for thumb-friendly reach. Filled `#5B50E5` with `#FFFFFF` medium text. Slight press compression (`transform: [{ scale: 0.98 }]`).
- **Secondary Action Button:** 52px height. Background `#F5F5F3`, text `#1C1D1F`, border 1px `#E5E7EB`.
- **Master Mic Target:** A 76px circular trigger floating above bottom navigation. Features an inner active core (`#5B50E5`) surrounded by an outer 8px translucent breathing pulse (`#EEF0FD`). In active listening state, the ring reacts to audio amplitude.

### Voice Waveform & Dynamic Orb
- **Audio Visualizer:** Horizontal sequence of 28-36 rounded vertical bars (3px width, 2px radius). Bar heights transition fluidly between 4px and 40px using native spring physics. Inactive bars remain `#E5E7EB`; active voice amplitudes illuminate in `#5B50E5`.
- **Breathing AI Orb:** For open conversation sessions, a 120px circular canvas rendered with a radial gradient transitioning from indigo (`#5B50E5`) to electric lavender (`#818CF8`), scaling slightly on vocal input.

### Metric Cards & Score Badges
- **Analysis Card:** White surface, 16px padding, 1px `#E5E7EB` border. Houses interview metrics (e.g., "Pace: 135 WPM", "Confidence: 92%").
- **Status Pills:** Compact 24px height, 10px horizontal padding, 9999px radius.
  - Good/Optimal: Background `#ECFDF5`, text `#065F46`.
  - Review Needed: Background `#FFFBEB`, text `#92400E`.

### Speech Transcript & Real-Time Correction
- **Transcript Bubble:** Left-aligned AI feedback bubbles use `#F5F5F3`; right-aligned user speech bubbles use `#EEF0FD` with `#1C1D1F` body text.
- **Inline Grammar & Filler Highlights:** Problem words are underscored with a dotted 1.5px amber (`#F59E0B`) or rose (`#EF4444`) line. Tapping an item summons a lightweight popover with a suggested alternative and an audio pronunciation snippet.

### Segmented Controls & Navigation
- **Segmented Tabs:** Inset capsule container with `#F5F5F3` background, 4px inner padding. Active segment glides across using a white pill container with subtle boundary border and ambient shadow.
- **Bottom Navigation:** Fixed 64px bar with transparent backdrop blur (`blurEffect: 'systemMaterialLight'`), featuring clean 22px stroke icons with muted labels (`#6B7280`) switching to active `#5B50E5`.