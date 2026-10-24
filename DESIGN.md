---
name: Nocturne Reader
colors:
  surface: '#06132a'
  surface-dim: '#06132a'
  surface-bright: '#2e3952'
  surface-container-lowest: '#020d25'
  surface-container-low: '#0f1b33'
  surface-container: '#131f37'
  surface-container-high: '#1e2a42'
  surface-container-highest: '#29344e'
  on-surface: '#d8e2ff'
  on-surface-variant: '#d9c2b1'
  inverse-surface: '#d8e2ff'
  inverse-on-surface: '#253049'
  outline: '#a18d7d'
  outline-variant: '#534436'
  surface-tint: '#ffb873'
  primary: '#ffbc7c'
  on-primary: '#4b2800'
  primary-container: '#f29a3b'
  on-primary-container: '#633700'
  inverse-primary: '#8c5000'
  secondary: '#cac6bd'
  on-secondary: '#32302a'
  secondary-container: '#4b4942'
  on-secondary-container: '#bcb8af'
  tertiary: '#74dea6'
  on-tertiary: '#003821'
  tertiary-container: '#57c28c'
  on-tertiary-container: '#004c2f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbf'
  primary-fixed-dim: '#ffb873'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6a3b00'
  secondary-fixed: '#e7e2d8'
  secondary-fixed-dim: '#cac6bd'
  on-secondary-fixed: '#1d1c16'
  on-secondary-fixed-variant: '#494740'
  tertiary-fixed: '#8df8bd'
  tertiary-fixed-dim: '#71dba2'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005232'
  background: '#06132a'
  on-background: '#d8e2ff'
  surface-variant: '#29344e'
typography:
  headline-lg:
    fontFamily: Merriweather
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
  headline-sm:
    fontFamily: Merriweather
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Merriweather
    fontSize: 17px
    fontWeight: '300'
    lineHeight: 28px
  body-md:
    fontFamily: Merriweather
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Merriweather
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
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

This design system crafts an immersive, tactile reading experience tailored for engineering practitioners under the stillness of a night shift. It blends the warmth and intimacy of a physical illuminated book with the precision of an on-call mission control terminal.

### Aesthetic Movement: Nocturnal Editorial & Tactile Papercraft
The interface merges deep, low-eye-strain nocturnal canvas framing with rich physical paper insets. The narrative unfolds on warm parchment-toned surfaces that soften intense ocular fatigue, enclosed within deep twilight console enclosures. Structural elements lean on gentle skeuomorphic tactile cues—soft paper edges, warm diffused drop-shadows, and glowing amber lantern indicators that signal state changes without harsh glares.

### Emotional Tone
- **Focused & Meditative:** Calm backgrounds eliminate night-time screen glare and sensory overload.
- **Literary & Narrative:** Evokes flipping through a prestige technical novella or annotated field manual.
- **Tactile & Reassuring:** Decisions feel physical; outcome cards and choices mimic tangible story flashcards.

## Colors

The palette establishes an atmospheric reading environment optimized for nocturnal low-ambient light scenarios.

### Functional Color Roles
- **Canvas Base (`#0F1B33`):** The midnight foundation layer; anchors structural UI chrome, navigation bars, and background scrims.
- **Surface Elevation Containers (`#182848` & `#1E325A`):** Tonal layers for dark controls, system telemetry docks, and console toolbars.
- **Narrative Paper Surface (`#FBF6EC`):** Warm illuminated sheet for narrative prose and interactive scenario dilemmas.
- **Primary Ink on Paper (`#182238`):** Deep charcoal ink, providing natural contrast without the stark harshness of pure black.
- **Secondary Ink on Paper (`#5A6578`):** Subtle warm slate for annotations, footnote metadata, and secondary narrative prose.
- **Lantern Amber (`#F29A3B`):** Glowing primary accent evoking amber terminal filaments and cozy desk lamps; reserves attention for active selections and narrative transitions.
- **Verdant Emerald (`#2E9E6B`):** Designates resilient code pathways, successful bug mitigations, and optimal outcomes.
- **Crimson Red (`#D9483B`):** Designates production incidents, regressions, and cascading architectural failures.
- **Text on Dark (`#FFFFFF` & `#E4ECFA`):** High-clarity illumination for system-level controls, metrics, and persistent mobile headers.

## Typography

The typographic hierarchy uses a deliberate dual-personality pairing:

1. **Merriweather (Narrative Core):** Drives story headlines and long-form prose. Its robust serifs, open apertures, and deliberate x-height provide exceptional legibility on warm paper cards, mimicking fine publishing.
2. **Plus Jakarta Sans (Operational Interface):** Governs chips, progress meters, interactive option tiles, and mobile status indicators. Its clean geometric lines keep metadata distinct from literary copy.

### Text Formatting Principles
- **Editorial Tracking:** Headlines carry subtle negative letter-spacing (`-0.01em`) for tight literary cohesion, while uppercase label tokens (`label-sm`) utilize wide tracking (`+0.06em`) for scanability in low light.
- **Narrative Line Length:** Prose blocks within paper cards are constrained to comfortably padded viewports to keep line lengths between 45–65 characters.

## Layout & Spacing

The layout is optimized for single-handed mobile navigation in night-shift conditions.

### Layout Mechanics
- **Grid Architecture:** 4-column fluid mobile grid with `1.25rem` screen margins and `1rem` column gutters.
- **Comfortable Reach Zone:** Critical decision cards, pagination buttons, and incident triggers are positioned within the lower two-thirds of the viewport.
- **Reading Enclosures:** The primary narrative viewport nests within a continuous or paginated floating card structure bounded by `space-lg` (`1.5rem`) internal padding.

## Elevation & Depth

Visual hierarchy uses a dual-plane model contrasting dark console structures with elevated paper sheets.

### Depth Archetypes
1. **The Twilight Trench (Level 0):** Background canvas `#0F1B33` with zero elevation.
2. **Console Containers (Level 1):** Tone-stepped `#182848` or `#1E325A` panels with crisp `1px` translucent borders (`rgba(228, 236, 250, 0.08)`) and no harsh shadows.
3. **The Narrative Leaf (Level 2):** Paper surfaces `#FBF6EC` casting a warm ambient glow: `0 10px 30px -5px rgba(0, 0, 0, 0.45), 0 4px 12px -2px rgba(242, 154, 59, 0.06)`, finished with an ultra-subtle warm rim border (`1px solid rgba(24, 34, 56, 0.06)`).
4. **Interactive Overlays & Critical Dilemmas (Level 3):** Modal cards and outcome overlays float with deeper atmospheric diffusion: `0 20px 40px -10px rgba(0, 0, 0, 0.65)`.

## Shapes

The interface embraces organic, tactile radii that emulate deckled cards and approachable mobile hardware.

- **Base Radius (`0.5rem` / `8px`):** Used for micro-badges, code snippets, and metadata indicators.
- **Component Large (`1rem` / `16px`):** Applied to primary buttons, interactive scenario chips, and input fields.
- **Container Extra Large (`1.5rem` / `24px`):** Applied to full story paper sheets, consequence cards, and bottom sheet dialogs.

## Components

### Buttons
- **Primary Lantern Action:** Minimum 48px height (`h-12`). Solid `#F29A3B` background with `#0F1B33` heavy sans-serif typography. Subtle amber rim highlight. Pressed state translates downward by 1px with reduced shadow to emulate a tactile switch.
- **Console Secondary Action:** Dark container `#1E325A` with `#FFFFFF` text and `1px solid rgba(228, 236, 250, 0.15)`.
- **Paper Dilemma Choice Button:** Built directly onto the `#FBF6EC` surface. Features `#FBF6EC` background, `2px solid #182238` border, and `#182238` text. Active/selected state shifts to `#182238` background with `#FBF6EC` text.

### Story & Game Cards
- **Narrative Paper Sheet:** Curved card (`roundedness-xl`) in `#FBF6EC` with rich internal breathing room (`space-lg`). Includes top chapter metadata in muted slate `#5A6578` and body copy in high-contrast ink `#182238`.
- **Consequence / Outcome Card:** Appears after an engineering choice. Contains an illuminated status pill (Emerald `#2E9E6B` for system recovery; Crimson `#D9483B` for production outage) with an inset terminal output block.

### Status Chips & Badges
- **Console Telemetry Chips:** Capsule shapes (`rounded-full`) in `#182848` featuring a 6px status dot (glowing green or amber pulse) and crisp `label-sm` text in `#E4ECFA`.
- **Story Tag Chips:** Rendered in low-opacity amber (`rgba(242, 154, 59, 0.12)`) on dark, or soft ink wash (`rgba(24, 34, 56, 0.08)`) on paper.

### Progress Meters & Night Indicators
- **Story Chapter Gauge:** Segmented thin rail (`4px` height) with rounded caps. Inactive segments reside at `#1E325A`; filled segments glow in `#F29A3B`.
- **Shift Telemetry Tracker:** Fixed top HUD element displaying shift timestamp, server health percentage, and read progression.

### Checkboxes & Dilemma Radios
- Minimum touch bounds of 48x48px with a visible 24px control area.
- Radio toggles on paper use thick ink-border rings (`2px solid #182238`). Selected state features a filled center dot with an animated spring pop.