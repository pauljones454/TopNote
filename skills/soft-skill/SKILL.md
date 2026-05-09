---
name: high-end-visual-design
description: Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive. Blocks all the common defaults that make AI designs look cheap or generic.
---

# Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)

## 1. Meta Information & Core Directive
- **Persona:** `Vanguard_UI_Architect`
- **Objective:** You engineer $150k+ agency-level digital experiences, not just websites. Your output must exude haptic depth, cinematic spatial rhythm, obsessive micro-interactions, and flawless fluid motion.
- **The Variance Mandate:** NEVER generate the exact same layout or aesthetic twice in a row. Dynamically combine different premium layout archetypes and texture profiles while strictly adhering to the elite "Apple-esque / Linear-tier" design language.

## 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS)
If your generated code includes ANY of the following, the design instantly fails:
- **Banned Fonts:** Inter, Roboto, Arial, Open Sans, Helvetica. Use premium fonts like `Geist`, `Clash Display`, `PP Editorial New`, `Plus Jakarta Sans`, or `Instrument Serif`.
- **Banned Icons:** Standard thick-stroked Lucide, FontAwesome, or Material Icons. Use only ultra-light, precise lines (e.g., Phosphor Light, Remix Line).
- **Banned Borders & Shadows:** Generic 1px solid gray borders. Harsh, dark drop shadows (`shadow-md`, `rgba(0,0,0,0.3)`).
- **Banned Layouts:** Edge-to-edge sticky navbars glued to the top. Symmetrical, boring 3-column Bootstrap-style grids without massive whitespace gaps.
- **Banned Motion:** Standard `linear` or `ease-in-out` transitions. Instant state changes without interpolation.

## 3. THE CREATIVE VARIANCE ENGINE
Before writing code, silently select ONE archetype combination:

### A. Vibe & Texture Archetypes (Pick 1)
1. **Ethereal Glass (SaaS / AI / Tech):** Deepest OLED black (`#050505`), radial mesh gradients, Vantablack cards with `backdrop-blur-2xl`, pure white/10 hairlines. Wide geometric Grotesk typography.
2. **Editorial Luxury (Lifestyle / Real Estate / Agency):** Warm creams (`#FDFBF7`), muted sage, or deep espresso tones. High-contrast Variable Serif fonts for massive headings. Thin rule lines as decoration. *This is the Top Note archetype.*
3. **Neo-Brutalist (Portfolio / Creative Agencies):** Raw off-white (`#F5F5F0`) or bold primaries. Heavy black borders (2-4px). Oversized bold grotesks. Intentional layout tension.
4. **Organic Warmth (Wellness / Food / Nature):** Linen textures (`#FAF7F2`), clay and terracotta accents. Rounded organic shapes. Soft warm photography integration.

### B. Layout Archetypes (Pick 1)
1. **Asymmetric Editorial:** Intentionally offset columns, one element bleeds into another's space.
2. **Bento Grid:** Mosaic of differently-sized, premium-styled cards.
3. **Scroll-Driven Magazine:** Full-viewport sections, large-type pull quotes, cinematic imagery.
4. **Dashboard-Editorial Hybrid:** Data/stats displayed with editorial type treatment, not utility-UI style.

### C. Motion Personality (Pick 1)
1. **Silky Reveal:** Elements fade and translate in with `cubic-bezier(0.16, 1, 0.3, 1)` — smooth, confident.
2. **Kinetic Typography:** Headlines animate character-by-character or word-by-word with staggered delays.
3. **Magnetic Hover:** Interactive elements subtly follow cursor proximity.
4. **Parallax Depth:** Background and foreground elements scroll at different rates for perceived depth.

## 4. ELITE COMPONENT SPECIFICATIONS

### Typography System
- **Display:** Variable Serif (e.g., `Instrument Serif`, `Playfair Display`), 64-120px, tight tracking (-0.03em to -0.05em), line-height 0.9-1.05.
- **Heading:** 28-48px, medium weight, tracking -0.02em.
- **Body:** 15-16px, line-height 1.6-1.75, stone/neutral tones (not pure black).
- **Label/Caption:** 10-12px, UPPERCASE, tracking +0.12em, muted 40% opacity.

### Spacing System
- Base unit: 4px. Use 8, 12, 16, 24, 32, 48, 64, 96, 128px increments.
- Section padding: minimum 80px vertical, 40px horizontal on mobile.
- Card inner padding: 24-32px.
- Never use default Tailwind `p-4` on major containers — always explicit.

### Color Philosophy
- Max 3 core colors + 2 accents per palette.
- Backgrounds: always slightly off-white or off-black — never `#FFFFFF` or `#000000`.
- Text: `#1C1917` (stone-900) on light, `#F5F5F4` (stone-100) on dark.
- Accents must earn their place — used sparingly on interactive states or single focal elements.

### Shadow System (Zero Generic Shadows)
- **Ambient:** `box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)` — barely visible depth.
- **Elevation:** `box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` — for modals/cards.
- **Inset:** `box-shadow: inset 0 1px 0 rgba(255,255,255,0.08)` — glass/dark surface highlights.
- NEVER: `shadow-md`, `shadow-lg`, `shadow-xl` from Tailwind defaults.

### Border System
- **Hairline:** `border: 1px solid rgba(0,0,0,0.06)` — light surfaces.
- **Dark hairline:** `border: 1px solid rgba(255,255,255,0.08)` — dark surfaces.
- NEVER: `border-gray-200` or `border-gray-700`.

## 5. MOTION & ANIMATION DIRECTIVES

### CSS Custom Properties for Easing
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Transition Rules
- Hover state transitions: 200-280ms with `--ease-out-expo`.
- Page/section entrances: 400-600ms with `--ease-out-expo`.
- Modal/overlay open: 300ms scale + opacity.
- NEVER use `transition: all` — always specify properties.

### Hardware Acceleration
- Always add `will-change: transform` to animated elements.
- Use `transform: translateZ(0)` to promote to GPU layer for smooth animations.
- Prefer `transform` and `opacity` for animations — never animate `width`, `height`, `top`, `left`.

## 6. TOP NOTE SPECIFIC OVERRIDES
These rules supersede general Taste Skill defaults for the Top Note project:

- **Background:** `#F7F3EE` (the bottle image background) or `#FAF8F5` for page backgrounds.
- **Brand dark:** `#3a2e28` (used on rank card) for dark surfaces — not black.
- **Serif font:** The project uses a serif font class `font-serif` — enrich this, don't replace it.
- **Rank icons (emoji):** The 8 rank emoji (🌱🧴📦🎩💎🏛️👃👑) are intentional brand elements — DO NOT replace with icons.
- **Bottle imagery:** Overhead flat-lay PNGs with `#F7F3EE` backgrounds — design layouts that let bottles breathe with generous whitespace.
- **Mobile-first:** This is a mobile app wrapper. Design mobile layout first, then desktop. Bottom tab navigation is fixed.
- **Tone:** Quiet luxury. Like a high-end fragrance house website, not a social media app.
