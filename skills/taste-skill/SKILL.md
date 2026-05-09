---
name: design-taste-frontend
description: Senior UI/UX Engineer skill. Enforces metric-based design rules, strict Next.js/React component architecture, CSS hardware acceleration, and balanced design engineering. Prevents generic AI frontend output.
---

# High-Agency Frontend Skill

## 1. ACTIVE BASELINE CONFIGURATION
* DESIGN_VARIANCE: 8 (1=Perfect Symmetry, 10=Artsy Chaos)
* MOTION_INTENSITY: 5 (1=Static, 10=Cinematic) — restrained for luxury feel
* VISUAL_DENSITY: 3 (1=Art Gallery/Airy, 10=Packed Data) — Top Note is airy

**AI Instruction:** These baseline values are set for Top Note. Adapt dynamically based on user requests. Use these as global variables driving design decisions.

## 2. DEFAULT ARCHITECTURE & CONVENTIONS

### Mandatory Checks Before Writing Any Code
* **DEPENDENCY VERIFICATION:** Before importing ANY 3rd party library, check `package.json`. If missing, output the install command first. Never assume a library exists.
* **TAILWIND VERSION:** Check `package.json` — Top Note uses Tailwind v4. Use `@tailwindcss/postcss` in postcss config, NOT `tailwindcss` plugin.
* **NEXT.JS VERSION:** Top Note uses Next.js 16 with App Router. Default to Server Components. Middleware file is `middleware.ts` (not `proxy.ts`).

### Component Architecture
* Default to React Server Components (RSC) for data-fetching and layout.
* Client Components (`"use client"`) only for: state, event handlers, browser APIs, animations.
* Extract interactive islands as isolated leaf components.
* Never add `"use client"` to a component that doesn't need it.

### Styling Rules
* Tailwind CSS v4 for 90% of styling.
* Custom CSS properties in `globals.css` for design tokens (easing, shadows, colors).
* Never use `@apply` for complex component styles — write the classes directly.
* Inline `style` props only for dynamic values (e.g., `style={{ width: \`\${pct}%\` }}`).

## 3. TYPOGRAPHY RULES
* **Never use Inter, Roboto, Arial, Open Sans, or Helvetica** as the primary typeface.
* Top Note uses a serif (`font-serif`) + sans system — honor and extend this, don't override it.
* Display sizes: 48-96px with tight tracking (-0.02em to -0.04em).
* Body: 14-16px, `leading-relaxed` (1.6+), stone-600/700 (never pure black body text).
* Labels: 9-11px, uppercase, tracking-widest, muted opacity.

## 4. COLOR DISCIPLINE
* Top Note palette:
  - Page background: `#F7F3EE` or `#FAF8F5`
  - Brand dark surface: `#3a2e28`
  - Text primary: `stone-900` (`#1C1917`)
  - Text secondary: `stone-400` to `stone-500`
  - Borders: `rgba(0,0,0,0.06)` hairlines — never `border-stone-200`
* Max 3 core + 2 accent colors per screen.
* Niche pill: violet. Ultra-niche: purple. M.Eastern: amber. Designer: stone.

## 5. MOTION STANDARDS
* Easing variables (add to `globals.css` if not present):
  ```css
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  ```
* Hover transitions: 200ms `var(--ease-out-expo)` on `transform` and `opacity` only.
* Page entrance animations: `opacity-0 translate-y-2` → `opacity-100 translate-y-0`, 400ms.
* Hardware acceleration: `will-change: transform` on animated elements.
* NEVER animate `width`, `height`, `top`, `left` — always `transform`.

## 6. LAYOUT PRINCIPLES
* Mobile-first. Top Note is a mobile app. Design 390px wide first.
* Bottom tab bar is fixed — content must account for its height (64px safe area).
* Section padding: `px-5 py-6` on mobile, `md:px-10 md:py-10` on desktop.
* Max content width: `max-w-[700px]` (established in existing pages — maintain it).
* Generous whitespace. When in doubt, add more air.
* Cards: `rounded-2xl` with ambient shadow, never hard borders.

## 7. STRICT ANTI-PATTERNS FOR TOP NOTE
* NO generic "card with border and shadow-md" patterns.
* NO full-width solid color button bars spanning the whole viewport.
* NO thick bottom borders on nav items — use subtle indicators or opacity.
* NO placeholder shimmer that looks like every other loading state.
* NO emoji in UI chrome (navigation, buttons, labels) — rank icons are the only exception and they are intentional brand elements.
* NO `console.log` left in committed code.
* NO TypeScript `any` type — always type properly.
