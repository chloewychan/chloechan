# ChloeFriendly / Sewciety illustrated company sections

## Overview

Replace the current plain-text `CompanySection.astro` rendering for the
ChloeFriendly and Sewciety entries with a fully illustrated section — a
watercolor background, a hover/click "capsule machine" reveal, link
buttons, a decorative photo, and a photo strip that pins the section while
it scrolls internally — using the source art already dropped in
`assets/chloefriendly-source/` and `assets/sewciety-source/`.

Follows the general visual/interaction language established by the
Reverielle/Compositwin `illustrated` project layout (background wash +
overlaid art, `wiggle-sprite` + `hover-expand` treatment on clickable
pieces, pill-shaped link buttons with real text overlaid on the art, a
plain stacked-text fallback below the `sm` breakpoint) — but not its exact
implementation, since that layout's components assume every layer is
pre-composed onto one shared 4096×1714 canvas, and ChloeFriendly/Sewciety's
assets are independent, differently-sized sprites (only `background.png`
is a full canvas). See "Why not reuse ProjectIllustrated" below.

## Goals

- Render ChloeFriendly and Sewciety with the illustrated treatment shown
  in the two provided mockups.
- Capsule machine: closed by default, opens on hover, and on click grows a
  text panel showing the company's real bio data (position/timeline/
  highlights) from the capsule's position up into the machine's dome area.
- Photo strip: scrolling into the section pins it (title/capsule/buttons
  all stay static) while only the strip scrolls internally; once fully
  revealed, normal page scroll resumes into the next section.
- Keep the site's existing conventions: content-driven (no hardcoded
  per-company values in components), `wiggle-sprite`/`hover-expand` reuse,
  reduced-motion respect, mobile fallback consistent with the illustrated
  projects.

## Non-goals

- No changes to Reverielle/Compositwin or `ProjectIllustrated.astro`.
- No mobile-adapted version of the capsule game or the scroll-pin — mobile
  gets the same plain stacked-text fallback pattern as the illustrated
  projects (confirmed with user).
- No real link URLs yet — `links[].url` uses `"#"` placeholders, matching
  the existing `websiteUrl: "#"` convention on the WIP illustrated
  projects.
- Not building a generic "N-image carousel" for the photo strip — each
  company's `photostrip.png` is one pre-composed image (already containing
  multiple photos/placeholder frames baked in); the scroll-pin reveals
  more of that one image, it doesn't page between separate image files.

## Why not reuse `ProjectIllustrated`

Reverielle/Compositwin's blind box, buttons, and selfie are all exported
as full 4096×1714 canvases with the art pre-positioned exactly where it
was drawn in the source file — `inset:0` stacking plus a handful of
content-driven `x/y/w/h` percentages (matching where each canvas's content
happens to sit) is enough to line everything up.

ChloeFriendly/Sewciety's `capsulemachine.png`, `capsule-closed.png`,
`capsule-open.png`, `logo.png`, `selfie.png`, `photostrip.png`, and the
button art are all independently-cropped sprites with no shared canvas —
there's nothing for page-wide percentages to line up *against*. Forcing
them onto a synthetic 4096×1714 space would mean inventing pixel-perfect
coordinates with no design-file source of truth, which is fragile to tune
and buys nothing since these sprites were never composed together in the
first place. A flexbox layout is simpler, more robust, and responsive by
construction (only the capsule-machine's own internal sprite/text-panel
positions need percentage math, scoped to that component's own local box —
see below).

## Content schema changes

`src/content.config.ts`, `companies` collection — new optional fields
(existing companies without them are unaffected):

```ts
const companies = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/companies' }),
  schema: base.extend({
    label: z.string().default('Company'),
    position: z.string(),
    timeline: z.string(),
    highlights: z.array(z.string()).default([]),

    // illustrated-capsule only — art lives in assets/<assetDir>-source/
    // (optimized into public/images/projects/<assetDir>/ by the existing
    // generic optimize-images.mjs pipeline, no script changes needed).
    layout: z.enum(['illustrated-capsule']).optional(),
    assetDir: z.string().optional(),
    // which side the photo strip sits on; the capsule machine takes the
    // opposite side, title/links sit in the middle
    photostripPosition: z.enum(['left', 'right']).optional(),
    logoAlt: z.string().optional(),
    // link buttons — a flexible list instead of named
    // websiteUrl/etsyUrl/githubUrl/instagramUrl fields, since the two
    // companies already have different counts/kinds (2 vs 3) and future
    // companies may link to yet other platforms. Rendered in order,
    // cycling through that company's button1/button2/button3... art.
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  }),
});
```

`src/content/companies/chloefriendly.json` gains:
```json
"layout": "illustrated-capsule",
"assetDir": "chloefriendly",
"photostripPosition": "right",
"logoAlt": "ChloeFriendly bunny mascot holding a crochet hook",
"links": [
  { "label": "Etsy Shop", "url": "#" },
  { "label": "Instagram", "url": "#" }
]
```

`src/content/companies/sewciety.json` gains:
```json
"layout": "illustrated-capsule",
"assetDir": "sewciety",
"photostripPosition": "left",
"logoAlt": "UW Sewciety duck-with-needle mascot",
"links": [
  { "label": "Visit Website", "url": "#" },
  { "label": "Github Repo", "url": "#" },
  { "label": "Instagram", "url": "#" }
]
```

`calla.json` (hidden, no `layout` field) is untouched and keeps rendering
through the existing plain `CompanySection.astro`.

## Component architecture

```
src/components/sections/
  CompanyIllustrated.astro          — the section: pin wrapper, background,
                                       title/tagline/highlights/links column,
                                       renders CapsuleMachine + PhotoStrip
  illustrated/
    CapsuleMachine.astro            — capsule hover/click behavior
    PhotoStrip.astro                — windowed, scroll-driven strip image
```

`src/pages/index.astro`'s companies loop branches on `layout`, same
pattern as the existing projects loop:

```astro
{companies.map((company) =>
  company.data.layout === 'illustrated-capsule' ? (
    <CompanyIllustrated
      id={`company-${company.id}`}
      assetDir={company.data.assetDir!}
      label={company.data.label}
      title={company.data.title}
      tagline={company.data.tagline}
      position={company.data.position}
      timeline={company.data.timeline}
      highlights={company.data.highlights}
      photostripPosition={company.data.photostripPosition ?? 'right'}
      logoAlt={company.data.logoAlt ?? ''}
      links={company.data.links ?? []}
    />
  ) : (
    <CompanySection ... /* unchanged */ />
  )
)}
```

### `CompanyIllustrated.astro` layout (≥ `sm`)

Flexbox row inside the pin (see scroll-pin section for the outer
structure): `[photostrip column] [title/tagline/highlights/links column]
[capsule machine column]`, order controlled by `photostripPosition` (the
capsule machine always takes the side opposite the strip, matching both
mockups). `logo.png` renders small, next to the title. `selfie.png`
renders as a plain `hover-expand` image (no wiggle, matching the existing
"selfie is deliberately not a wiggle sprite" convention) near the
title/links column — for ChloeFriendly this is the real photo of the user
holding a plush; for Sewciety it's the blank decorative frame asset as
provided (no photo yet, matches the mockup).

### Below `sm` (mobile fallback)

Same convention as `ProjectIllustrated.astro`'s `.illustrated-mobile`:
plain stacked text — label, title, tagline, position/timeline/highlights,
link list — no capsule game, no photostrip, no pin. The pin/tall-wrapper
markup itself is also skipped below `sm` (not just hidden), so no extra
scroll height is reserved on mobile.

### Link buttons

Reuses the `illustrated-button` / `hover-expand` styling from
`global.css`. Each `links[]` entry renders one button, stacked vertically
in the title column via normal flex `gap` (no baked-in offset math needed,
unlike Reverielle/Compositwin's `BUTTON2_Y_OFFSET`, since these aren't
positioned on a shared canvas). Button art cycles
`button{(index % 3) + 1}.png` per company's `assetDir`.

## Capsule machine interaction

`CapsuleMachine.astro` wraps `capsulemachine.png` in its own local
coordinate box: `position: relative; aspect-ratio: 1002 / 1032` (the
art's native size — both companies' machine art shares this template, so
proportions below are hardcoded once rather than threaded as per-company
content fields).

- **Default**: `capsule-closed.png`, positioned near the machine's
  dispenser slot (lower-center of the art).
- **Hover**: crossfades to `capsule-open.png` — same opacity-crossfade
  technique as the hero's social icons (`.hero-icon__img--closed/--open`).
- **Click**: toggles an `.expanded` class on the hit region (same pattern
  as `BlindBox.astro`'s click handler). A text panel transitions from a
  small, capsule-sized box at the capsule's position to a larger box
  positioned over the machine's dome area above it — both position and
  size animate via a CSS transition on `top/left/width/height`.
- The capsule shows `capsule-open.png` whenever **hovered OR expanded**
  (`:hover ~ / .expanded ~` sibling selectors, same as `BlindBox`), so it
  stays visually "cracked open" while its contents become the text panel.
- **Content**: the panel shows the company's real `position`, `timeline`,
  and `highlights` (when non-empty) — the same fields `CompanySection`
  already renders, not placeholder filler text.
- **Close**: clicking again reverts it, same toggle behavior as the blind
  box.
- Whole machine gets `.wiggle-sprite` (seeded via `wiggleVariant`) +
  `.hover-expand`, consistent with the rest of the site's clickable art.

## Photo strip scroll-pin

Freezes the **entire section** (title, capsule, buttons — not just the
strip) while the strip scrolls internally, then releases into normal
scroll. Structure:

```
<section class="company-illustrated-section">   ← tall wrapper:
                                                     height = 100vh + extra-scroll
  <div class="company-illustrated-pin">          ← position: sticky;
                                                     top: var(--nav-height);
                                                     height: calc(100vh - var(--nav-height))
    ...background, title/links column, capsule machine, selfie...
    <div class="photostrip-window">              ← overflow: hidden,
                                                     fixed height = pin's height
      <img class="photostrip-img" />             ← translateY driven by
                                                     scroll progress
    </div>
  </div>
</section>
```

This is the standard tall-wrapper-plus-sticky-inner scrollytelling
technique — **not** a `preventDefault`/wheel-hijack scroll-lock. `scrollY`
keeps advancing natively the whole time; the visual "pause" comes from the
sticky element not moving on screen until its wrapper's slack is used up,
which produces exactly the "freeze, then release" effect using native
scroll physics instead of hijacking input (which breaks trackpad
momentum, keyboard/spacebar scrolling, and touch, and needs fragile manual
re-dispatching of pass-through scroll).

A dedicated script (colocated in `CompanyIllustrated.astro`, Astro-deduped
across instances like the other illustrated components' scripts):

1. On load/resize, measures the photostrip image's rendered height at its
   column's current width (`naturalHeight/naturalWidth × columnWidth`)
   and the pin viewport's height, and sets the wrapper's extra height
   (`--extra-scroll`) to their difference (clamped ≥ 0).
2. On scroll (rAF-gated, same throttling style as the wiggle-sprite
   engine — schedule via `requestAnimationFrame`, only while the section
   is near the viewport), computes
   `progress = clamp((scrollY - wrapperTop) / extraScroll, 0, 1)` and
   sets `translateY(-progress × extraScroll)` on the strip image.

Under `prefers-reduced-motion: reduce`, the pin is skipped entirely: the
wrapper renders at normal height (no sticky, no extra scroll), and the
photostrip renders as a plain (possibly tall) image — consistent with how
the rest of the site already reads that setting.

## Asset pipeline

No changes needed to `scripts/optimize-images.mjs` — it already treats
any `assets/*-source/` directory (other than `hero-source`/
`general-source`) as a project/company asset set and outputs to
`public/images/projects/<id>/`. Unlike Reverielle/Compositwin's
`button1`/`button2`, none of these new files need the `TRIMMED_BASENAMES`
treatment — they're already individually cropped to their real content
(confirmed via `sips`: e.g. `capsule-closed.png` is 145×140,
`capsulemachine.png` is 1002×1032), not laid out on an oversized
transparent canvas.

## Testing / verification plan

- `npm run optimize-images` to generate `public/images/projects/
  {chloefriendly,sewciety}/`.
- `npm run check` for schema/type validation.
- `npm run dev` + Browser pane:
  - Visual check against the two provided mockups at desktop width.
  - Hover the capsule → opens; click → text panel grows into place with
    real bio data; click again → collapses.
  - Scroll into each section → confirm title/capsule/buttons hold still
    while the photostrip visually scrolls; confirm normal scroll resumes
    once the strip finishes.
  - Resize to mobile (`resize_window`) → confirm the plain stacked-text
    fallback, no pin/capsule interaction.
  - Toggle `prefers-reduced-motion` (via `resize_window`'s colorScheme-
    adjacent emulation or a manual OS check if unavailable in this tool) →
    confirm the pin is skipped.
  - Per the existing gotcha about this environment's Browser-pane
    screenshot/rAF flakiness: verify scroll-driven motion by DOM/class/
    computed-style inspection (`getBoundingClientRect`, the `--extra-
    scroll` custom property, `translate` style value) rather than trusting
    a single screenshot admid a scroll animation.
