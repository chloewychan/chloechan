# ChloeFriendly / Sewciety Illustrated Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain-text `CompanySection` rendering for ChloeFriendly and Sewciety with a fully illustrated section (capsule-machine hover/click reveal, scroll-pinned photo strip, pill link buttons) built from the art already in `assets/chloefriendly-source/` and `assets/sewciety-source/`.

**Architecture:** A new `illustrated-capsule` company layout variant, content-driven (assetDir/links/photostripPosition fields in JSON), rendered by a new `CompanyIllustrated.astro` + two sub-components (`CapsuleMachine.astro`, `PhotoStrip.astro`). Unlike the Reverielle/Compositwin illustrated projects (one pre-composed 4096×1714 canvas per art layer), these companies' sprites are independently cropped with no shared canvas, so the section is laid out with flexbox instead of page-wide percentage coordinates; only the capsule machine's own small sprite/panel positions use percentage math, scoped to its own local box. The photo strip pins the whole section (title/capsule/buttons static) while it scrolls internally via the standard tall-wrapper + `position: sticky` technique — not a wheel/touch scroll-lock.

**Tech Stack:** Astro 7 (`.astro` components, content collections + Zod schema), plain CSS in `src/styles/global.css` (no CSS framework beyond the Tailwind CDN used for utility classes like `hidden`/`sm:block`), vanilla TypeScript in component `<script>` tags, `sharp` via the existing `scripts/optimize-images.mjs`.

## Global Constraints

- No JS unit-test framework exists in this repo (confirmed: no Jest/Vitest/etc. in `package.json`, no `*.test.*`/`*.spec.*` files). Every task's "test" step is therefore one of: `npm run check` (Astro/TypeScript validation), a file-existence/shape check, or manual verification via the Browser pane tools against the running dev server — never a unit-test assertion. This mirrors how the existing `BlindBox`/`ExpandingCarousel`/`RotatingCarousel` components were verified.
- Follow existing naming/comment conventions exactly: block comments above CSS sections explaining *why*, not *what*; Astro `<script>` blocks note "Astro dedupes this across every X instance" where relevant; decorative images get `alt=""`, meaningful ones get real `alt` text.
- Reuse existing utility classes/CSS rather than duplicating them: `.hover-expand`, `.wiggle-sprite` + `bob-*` classes, `.section-label`, `.illustrated-title__name`, `.illustrated-title__tagline`, `.link`, `--nav-height`, `--radius-card`, `--font-hero`.
- Do not modify `scripts/optimize-images.mjs`, `ProjectIllustrated.astro`, `illustrated/BlindBox.astro`, `illustrated/ExpandingCarousel.astro`, `illustrated/RotatingCarousel.astro`, or `src/content/companies/calla.json` — out of scope per the design spec.
- Placeholder link URLs are `"#"` (matches the existing `websiteUrl: "#"` convention on the WIP illustrated projects) — not a gap to fill in later within this plan.

---

### Task 1: Content schema + JSON content

**Files:**
- Modify: `src/content.config.ts` (companies collection schema, ~line 76-88)
- Modify: `src/content/companies/chloefriendly.json`
- Modify: `src/content/companies/sewciety.json`

**Interfaces:**
- Produces: companies collection entries where `data.layout === 'illustrated-capsule'` carry `data.assetDir: string`, `data.photostripPosition: 'left' | 'right' | undefined`, `data.logoAlt: string | undefined`, `data.links: { label: string; url: string }[] | undefined` — consumed by Task 4's `index.astro` wiring and `CompanyIllustrated.astro` props.

- [ ] **Step 1: Extend the companies schema**

Edit `src/content.config.ts`. Find the `companies` collection definition:

```ts
const companies = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/companies' }),
  schema: base.extend({
    // Overline label above the title — defaults to "Company", but e.g. a
    // club or a startup can override it to say so.
    label: z.string().default('Company'),
    position: z.string(),
    timeline: z.string(),
    // Extra bullet points below Position/Timeline — optional, for things
    // like sales figures or follower counts that not every entry has.
    highlights: z.array(z.string()).default([]),
  }),
});
```

Replace it with:

```ts
const companies = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/companies' }),
  schema: base.extend({
    // Overline label above the title — defaults to "Company", but e.g. a
    // club or a startup can override it to say so.
    label: z.string().default('Company'),
    position: z.string(),
    timeline: z.string(),
    // Extra bullet points below Position/Timeline — optional, for things
    // like sales figures or follower counts that not every entry has.
    highlights: z.array(z.string()).default([]),

    // 'illustrated-capsule': fully custom hand-drawn scene — background
    // wash, a hover/click "capsule machine" reveal showing this same
    // position/timeline/highlights data, link buttons, a photo, and a
    // scroll-pinned photo strip (ChloeFriendly, Sewciety). Unlike
    // projects' 'illustrated' layout, this art isn't one shared canvas —
    // see CompanyIllustrated.astro for why it's laid out with flexbox
    // instead of page-wide x/y/w/h percentages.
    layout: z.enum(['illustrated-capsule']).optional(),
    // art lives in assets/<assetDir>-source/, optimized into
    // public/images/projects/<assetDir>/ by the existing generic
    // optimize-images.mjs pipeline (no script changes needed)
    assetDir: z.string().optional(),
    // which side the photo strip sits on; the capsule machine always
    // takes the opposite side, title/links sit in the middle
    photostripPosition: z.enum(['left', 'right']).optional(),
    logoAlt: z.string().optional(),
    // link buttons — a flexible list instead of named
    // websiteUrl/etsyUrl/githubUrl/instagramUrl fields, since the two
    // companies already have different counts/kinds (2 vs 3) of links.
    // Rendered in order, cycling through that company's
    // button1/button2/button3 art.
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  }),
});
```

- [ ] **Step 2: Update ChloeFriendly's content**

Read `src/content/companies/chloefriendly.json` (current contents):

```json
{
  "title": "ChloeFriendly",
  "tagline": "A crochet business specializing in coquette plushies, keychains, and accessories. Plushies and patterns are sold at in-person pop-ups and online shops (Etsy and Ko-Fi)",
  "order": 1,
  "label": "Small Business",
  "position": "Business Owner",
  "timeline": "May 2023 - Present",
  "highlights": [
    "Put out 3,000+ sales",
    "Received 200+ five-star review ratings",
    "Gained 10,000+ followers across all social media accounts",
    "Generated $10,000+ in revenue"
  ]
}
```

Replace it with:

```json
{
  "title": "ChloeFriendly",
  "tagline": "A crochet business specializing in coquette plushies, keychains, and accessories. Plushies and patterns are sold at in-person pop-ups and online shops (Etsy and Ko-Fi)",
  "order": 1,
  "label": "Small Business",
  "position": "Business Owner",
  "timeline": "May 2023 - Present",
  "highlights": [
    "Put out 3,000+ sales",
    "Received 200+ five-star review ratings",
    "Gained 10,000+ followers across all social media accounts",
    "Generated $10,000+ in revenue"
  ],
  "layout": "illustrated-capsule",
  "assetDir": "chloefriendly",
  "photostripPosition": "right",
  "logoAlt": "ChloeFriendly bunny mascot holding a crochet hook",
  "links": [
    { "label": "Etsy Shop", "url": "#" },
    { "label": "Instagram", "url": "#" }
  ]
}
```

- [ ] **Step 3: Update Sewciety's content**

Read `src/content/companies/sewciety.json` (current contents):

```json
{
  "title": "Sewciety",
  "tagline": "Provides free resources for UWaterloo students to learn, explore, and practice sewing.",
  "order": 3,
  "label": "University of Waterloo Club",
  "position": "Co-president",
  "timeline": "September 2025 - Present"
}
```

Replace it with:

```json
{
  "title": "Sewciety",
  "tagline": "Provides free resources for UWaterloo students to learn, explore, and practice sewing.",
  "order": 3,
  "label": "University of Waterloo Club",
  "position": "Co-president",
  "timeline": "September 2025 - Present",
  "layout": "illustrated-capsule",
  "assetDir": "sewciety",
  "photostripPosition": "left",
  "logoAlt": "UW Sewciety duck-with-needle mascot",
  "links": [
    { "label": "Visit Website", "url": "#" },
    { "label": "Github Repo", "url": "#" },
    { "label": "Instagram", "url": "#" }
  ]
}
```

- [ ] **Step 4: Verify the schema and content parse**

Run: `npm run check`
Expected: no errors related to `content.config.ts` or the two JSON files (pre-existing unrelated errors, if any, are out of scope — but there should be none on a clean repo).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/companies/chloefriendly.json src/content/companies/sewciety.json
git commit -m "Add illustrated-capsule company layout schema and content"
```

---

### Task 2: Generate optimized image assets

**Files:**
- Create (generated, not hand-written): `public/images/projects/chloefriendly/*.{avif,webp,png}`
- Create (generated, not hand-written): `public/images/projects/sewciety/*.{avif,webp,png}`

**Interfaces:**
- Produces: for each `assetDir` in `{chloefriendly, sewciety}`, files `background`, `button1`, `button2`, `capsule-closed`, `capsule-open`, `capsulemachine`, `logo`, `photostrip`, `selfie` (plus `button3` for `sewciety` only), each as `.avif`/`.webp`/`.png`, at `public/images/projects/<assetDir>/<basename>.<ext>` — consumed by every `src={...}`/`srcset={...}` reference in Tasks 3–5.

- [ ] **Step 1: Run the image optimizer**

Run: `npm run optimize-images`
Expected: console output includes `Optimizing illustrated project sections...` with lines for both `chloefriendly` and `sewciety` basenames (existing `reverielle`/`compositwin` lines will also print — that's expected, the script processes every `assets/*-source/` directory each run).

- [ ] **Step 2: Verify the expected files exist**

Run:
```bash
for id in chloefriendly sewciety; do
  for base in background button1 button2 capsule-closed capsule-open capsulemachine logo photostrip selfie; do
    for ext in avif webp png; do
      f="public/images/projects/$id/$base.$ext"
      [ -f "$f" ] || echo "MISSING: $f"
    done
  done
  for ext in avif webp png; do
    f="public/images/projects/sewciety/button3.$ext"
    [ -f "$f" ] || echo "MISSING: $f"
  done
done
echo "done"
```
Expected: no `MISSING:` lines printed, just `done`.

- [ ] **Step 3: Commit**

```bash
git add public/images/projects/chloefriendly public/images/projects/sewciety
git commit -m "Generate optimized image assets for ChloeFriendly and Sewciety"
```

---

### Task 3: CapsuleMachine component

**Files:**
- Create: `src/components/sections/illustrated/CapsuleMachine.astro`
- Modify: `src/styles/global.css` (append new "COMPANY — ILLUSTRATED CAPSULE" section)

**Interfaces:**
- Consumes: `wiggleVariant(seed, axis?)` from `src/lib/wiggleSprite.ts` — `wiggleVariant(seed: string): WiggleVariant` (default `axis: 'both'`), returns `{ bobClass, kick, friction, max, bobDur, bobDelay, axis }`.
- Produces: `CapsuleMachine.astro` accepting `Props { assetDir: string; companyName: string; position: string; timeline: string; highlights: string[] }`, rendering a `.capsule-machine` element — consumed by Task 4's `CompanyIllustrated.astro`.

- [ ] **Step 1: Write the component**

Create `src/components/sections/illustrated/CapsuleMachine.astro`:

```astro
---
// Capsule machine reveal for the illustrated company sections
// (ChloeFriendly, Sewciety). Closed by default; hovering crosses over to
// the open-capsule art; clicking toggles a persistent "expanded" state
// that grows a text panel from the capsule's own small spot up into the
// machine's dome area, showing this company's real position/timeline/
// highlights (not placeholder copy).
//
// Unlike the illustrated projects' blind box, this machine art isn't
// baked onto a shared page-wide canvas — it's its own independently
// cropped sprite. So `.capsule-machine` is its own local coordinate box
// (aspect-ratio matches the art's native 1002x1032 size) and every child
// position below is a percentage of *that* box, not the page.
//
// DOM order is [body, hit, closed, open, panel] so the `.capsule-hit:hover
// ~ .layer` sibling selectors in global.css can reach every later sibling
// (the general sibling combinator only matches later siblings) — same
// technique as illustrated/BlindBox.astro.
import { wiggleVariant } from '../../../lib/wiggleSprite';

interface Props {
  assetDir: string; // e.g. "chloefriendly" -> /images/projects/chloefriendly/
  companyName: string;
  position: string;
  timeline: string;
  highlights: string[];
}

const { assetDir, companyName, position, timeline, highlights } = Astro.props;
const base = `/images/projects/${assetDir}`;
const variant = wiggleVariant(`capsule-${assetDir}`);
const wiggleStyle = `--inertia-kick:${variant.kick}; --inertia-friction:${variant.friction}; --inertia-max:${variant.max}; --bob-dur:${variant.bobDur}s; --bob-delay:${variant.bobDelay}s;`;
---

<div class={`capsule-machine wiggle-sprite hover-expand ${variant.bobClass}`} style={wiggleStyle}>
  <picture class="capsule-machine__body">
    <source type="image/avif" srcset={`${base}/capsulemachine.avif`} />
    <source type="image/webp" srcset={`${base}/capsulemachine.webp`} />
    <img src={`${base}/capsulemachine.png`} alt="" loading="lazy" decoding="async" />
  </picture>

  <button type="button" class="capsule-hit" aria-label={`Reveal more about ${companyName}`}></button>

  <picture class="capsule-sprite capsule-sprite--closed">
    <source type="image/avif" srcset={`${base}/capsule-closed.avif`} />
    <source type="image/webp" srcset={`${base}/capsule-closed.webp`} />
    <img src={`${base}/capsule-closed.png`} alt="" loading="lazy" decoding="async" />
  </picture>

  <picture class="capsule-sprite capsule-sprite--open">
    <source type="image/avif" srcset={`${base}/capsule-open.avif`} />
    <source type="image/webp" srcset={`${base}/capsule-open.webp`} />
    <img src={`${base}/capsule-open.png`} alt="" loading="lazy" decoding="async" />
  </picture>

  <div class="capsule-panel">
    <p><strong>Position:</strong> {position}</p>
    <p><strong>Timeline:</strong> {timeline}</p>
    {highlights.length > 0 && (
      <ul>
        {highlights.map((point) => <li>{point}</li>)}
      </ul>
    )}
  </div>
</div>

<script>
  // Astro dedupes this across every CapsuleMachine instance on the page.
  document.querySelectorAll<HTMLButtonElement>('.capsule-hit').forEach((hit) => {
    hit.addEventListener('click', () => {
      hit.classList.toggle('expanded');
    });
  });
</script>
```

- [ ] **Step 2: Add the capsule machine CSS**

Append to `src/styles/global.css` (end of file):

```css

/* ============================================================
   COMPANY — ILLUSTRATED CAPSULE (ChloeFriendly, Sewciety)
   ============================================================
   Unlike the illustrated projects (one pre-composed 4096x1714 canvas per
   layer), these companies' art is a set of independently-cropped sprites
   with no shared canvas to line up against — background.png is the only
   full-canvas layer. So the section is laid out with flexbox (photo strip
   column / title+links column / capsule column) instead of percentage
   coordinates on a fixed canvas; only the capsule machine's own small
   sprite/text-panel positions use percentage math, scoped to its own
   local box (see below).
   ============================================================ */

/* ─── Capsule machine ─── */
.capsule-machine {
  position: relative;
  width: 100%;
  aspect-ratio: 1002 / 1032;
}

.capsule-machine__body {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.capsule-machine__body img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Positioned against the machine art's dispenser slot (lower-center) —
   shared by both companies since their capsule-machine art uses the same
   template/proportions, just recolored, so this is hardcoded once here
   rather than threaded as per-company content fields. */
.capsule-hit {
  position: absolute;
  left: 62%;
  top: 64%;
  width: 22%;
  height: 20%;
  z-index: 2;
  display: block;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.capsule-sprite {
  position: absolute;
  left: 62%;
  top: 64%;
  width: 22%;
  height: 20%;
  transition: opacity 220ms ease;
  pointer-events: none;
}

.capsule-sprite img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.capsule-sprite--closed {
  opacity: 1;
  z-index: 1;
}

.capsule-sprite--open {
  opacity: 0;
  z-index: 1;
}

.capsule-hit:hover ~ .capsule-sprite--closed,
.capsule-hit.expanded ~ .capsule-sprite--closed {
  opacity: 0;
}

.capsule-hit:hover ~ .capsule-sprite--open,
.capsule-hit.expanded ~ .capsule-sprite--open {
  opacity: 1;
}

/* Grows from the capsule's own small bbox (matching .capsule-hit/
   .capsule-sprite exactly, so it visually starts "as the capsule") up
   into the machine's dome area above — position and size animate
   together on click. */
.capsule-panel {
  position: absolute;
  left: 62%;
  top: 64%;
  width: 22%;
  height: 20%;
  z-index: 3;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  background-color: color-mix(in srgb, var(--color-bg) 92%, transparent);
  border-radius: var(--radius-card);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.18);
  padding: clamp(0.5rem, 1.5%, 1.25rem);
  transition: left 380ms ease, top 380ms ease, width 380ms ease, height 380ms ease, opacity 260ms ease;
  font-size: clamp(0.6rem, 1vw, 0.85rem);
  line-height: 1.4;
  color: var(--color-text);
}

.capsule-hit.expanded ~ .capsule-panel {
  left: 8%;
  top: 6%;
  width: 84%;
  height: 56%;
  opacity: 1;
  pointer-events: auto;
}

.capsule-panel p {
  margin: 0 0 0.4em;
}

.capsule-panel ul {
  list-style: disc;
  margin: 0.4em 0 0;
  padding-left: 1.1em;
}

.capsule-panel li + li {
  margin-top: 0.25em;
}
```

- [ ] **Step 3: Verify types**

Run: `npm run check`
Expected: no errors. (The component isn't rendered anywhere yet, so this only confirms the `.astro`/TS syntax and the `wiggleVariant` import are valid — full behavior is verified once it's embedded in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/illustrated/CapsuleMachine.astro src/styles/global.css
git commit -m "Add CapsuleMachine component with hover/click reveal"
```

---

### Task 4: CompanyIllustrated section (layout, PhotoStrip, mobile fallback, wiring)

**Files:**
- Create: `src/components/sections/illustrated/PhotoStrip.astro`
- Create: `src/components/sections/CompanyIllustrated.astro`
- Modify: `src/styles/global.css` (append section layout CSS)
- Modify: `src/pages/index.astro` (companies loop)

**Interfaces:**
- Consumes: `CapsuleMachine` from Task 3 (`Props { assetDir, companyName, position, timeline, highlights }`).
- Produces: `PhotoStrip.astro` accepting `Props { assetDir: string }`, rendering `.photostrip-column > .photostrip-window > .photostrip-img`. `CompanyIllustrated.astro` accepting `Props { id: string; assetDir: string; label: string; title: string; tagline: string; position: string; timeline: string; highlights: string[]; photostripPosition: 'left' | 'right'; logoAlt: string; links: { label: string; url: string }[] }` — consumed by `index.astro` and (for the scroll-pin script) Task 5.

- [ ] **Step 1: Write PhotoStrip.astro**

Create `src/components/sections/illustrated/PhotoStrip.astro`:

```astro
---
// The windowed, scroll-driven photo strip for the illustrated company
// sections. Each company's photostrip.png is one pre-composed image
// (multiple photos/placeholder frames already baked into one tall strip,
// not separate files) — this component just renders it inside a clipped
// window; CompanyIllustrated.astro's <script> drives how far it's
// scrolled via a `transform: translateY(...)` set directly on
// `.photostrip-img` (see that component for the scroll-pin mechanics).
interface Props {
  assetDir: string;
}

const { assetDir } = Astro.props;
const base = `/images/projects/${assetDir}`;
---

<div class="photostrip-column">
  <div class="photostrip-window">
    <picture class="photostrip-img">
      <source type="image/avif" srcset={`${base}/photostrip.avif`} />
      <source type="image/webp" srcset={`${base}/photostrip.webp`} />
      <img src={`${base}/photostrip.png`} alt="" loading="lazy" decoding="async" />
    </picture>
  </div>
</div>
```

- [ ] **Step 2: Write CompanyIllustrated.astro (layout only — no scroll-pin script yet, that's Task 5)**

Create `src/components/sections/CompanyIllustrated.astro`:

```astro
---
// Illustrated company section (ChloeFriendly, Sewciety): background
// wash, a hover/click capsule-machine reveal, link buttons, a decorative
// photo, and a scroll-pinned photo strip. See the "COMPANY — ILLUSTRATED
// CAPSULE" section of global.css for why this uses flexbox instead of
// the illustrated projects' fixed-canvas-percentage approach — these
// companies' art is a set of independently-cropped sprites, not one
// shared pre-composed canvas.
//
// Below `sm`, falls back to plain stacked text — same convention as
// ProjectIllustrated.astro's `.illustrated-mobile` — no capsule game, no
// photo-strip scroll-pin on mobile.
import CapsuleMachine from './illustrated/CapsuleMachine.astro';
import PhotoStrip from './illustrated/PhotoStrip.astro';

interface LinkItem {
  label: string;
  url: string;
}

interface Props {
  id: string;
  assetDir: string;
  label: string;
  title: string;
  tagline: string;
  position: string;
  timeline: string;
  highlights: string[];
  photostripPosition: 'left' | 'right';
  logoAlt: string;
  links: LinkItem[];
}

const {
  id,
  assetDir,
  label,
  title,
  tagline,
  position,
  timeline,
  highlights,
  photostripPosition,
  logoAlt,
  links,
} = Astro.props;

const base = `/images/projects/${assetDir}`;
---

<section id={id} class="company-illustrated-section">
  <div class="company-illustrated-mobile sm:hidden max-w-xl mx-auto w-full px-6">
    <span class="text-sm tracking-widest uppercase text-[var(--color-brand)] mb-2 block">{label}</span>
    <h2 class="illustrated-title__name mb-3">{title}</h2>
    <p class="illustrated-title__tagline mb-6">{tagline}</p>
    <div class="company-illustrated-mobile__details mb-6">
      <p><strong>Position:</strong> {position}</p>
      <p><strong>Timeline:</strong> {timeline}</p>
      {highlights.length > 0 && (
        <ul>
          {highlights.map((point) => <li>{point}</li>)}
        </ul>
      )}
    </div>
    <div class="flex gap-4 flex-wrap">
      {links.map((link) => (
        <a class="link" href={link.url} target="_blank" rel="noopener">
          {link.label} →
        </a>
      ))}
    </div>
  </div>

  <div class="company-illustrated-pin hidden sm:block">
    <picture class="company-illustrated-bg">
      <source type="image/avif" srcset={`${base}/background.avif`} />
      <source type="image/webp" srcset={`${base}/background.webp`} />
      <img src={`${base}/background.png`} alt="" loading="lazy" decoding="async" />
    </picture>

    <div class="company-illustrated-row">
      {photostripPosition === 'left' && <PhotoStrip assetDir={assetDir} />}

      <div class="company-illustrated-main">
        <div class="company-illustrated-header">
          <picture class="company-illustrated-logo">
            <source type="image/avif" srcset={`${base}/logo.avif`} />
            <source type="image/webp" srcset={`${base}/logo.webp`} />
            <img src={`${base}/logo.png`} alt={logoAlt} loading="lazy" decoding="async" />
          </picture>
          <div>
            <span class="section-label block mb-2">{label}</span>
            <h2 class="illustrated-title__name">{title}</h2>
          </div>
        </div>

        <p class="illustrated-title__tagline">{tagline}</p>

        <div class="company-illustrated-links">
          {links.map((link, i) => (
            <a class="company-link-button hover-expand" href={link.url} target="_blank" rel="noopener">
              <picture>
                <source type="image/avif" srcset={`${base}/button${(i % 3) + 1}.avif`} />
                <source type="image/webp" srcset={`${base}/button${(i % 3) + 1}.webp`} />
                <img src={`${base}/button${(i % 3) + 1}.png`} alt="" loading="lazy" decoding="async" />
              </picture>
              <span class="company-link-button__label">{link.label}</span>
            </a>
          ))}
        </div>

        <picture class="company-illustrated-selfie hover-expand">
          <source type="image/avif" srcset={`${base}/selfie.avif`} />
          <source type="image/webp" srcset={`${base}/selfie.webp`} />
          <img src={`${base}/selfie.png`} alt="" loading="lazy" decoding="async" />
        </picture>
      </div>

      <div class="company-illustrated-capsule-slot">
        <CapsuleMachine assetDir={assetDir} companyName={title} position={position} timeline={timeline} highlights={highlights} />
      </div>

      {photostripPosition === 'right' && <PhotoStrip assetDir={assetDir} />}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add the section layout CSS**

Append to `src/styles/global.css`, directly after the capsule machine CSS added in Task 3 (before the final newline):

```css

.company-illustrated-pin {
  position: sticky;
  top: var(--nav-height);
  height: calc(100vh - var(--nav-height));
  overflow: hidden;
}

.company-illustrated-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.company-illustrated-bg img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-illustrated-row {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 3%;
  padding: 0 4%;
}

.company-illustrated-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.company-illustrated-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.company-illustrated-logo {
  flex: none;
  display: block;
  width: clamp(3rem, 6vw, 4.5rem);
}

.company-illustrated-logo img {
  display: block;
  width: 100%;
  height: auto;
}

.company-illustrated-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.company-link-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(8rem, 14vw, 11rem);
  aspect-ratio: 4 / 1;
  text-decoration: none;
}

.company-link-button picture,
.company-link-button img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.company-link-button__label {
  position: relative;
  z-index: 1;
  font-family: var(--font-hero);
  font-weight: 600;
  font-size: clamp(0.65rem, 0.9vw, 0.85rem);
  color: var(--color-text);
  white-space: nowrap;
  pointer-events: none;
}

.company-illustrated-selfie {
  display: block;
  width: clamp(10rem, 20vw, 16rem);
}

.company-illustrated-selfie img {
  display: block;
  width: 100%;
  height: auto;
}

.company-illustrated-capsule-slot {
  flex: 0 0 clamp(12rem, 26%, 20rem);
}

/* ─── Photo strip (scroll-pinned — see CompanyIllustrated.astro's
   <script> for how .photostrip-img's transform is driven) ─── */
.photostrip-column {
  flex: 0 0 clamp(10rem, 24%, 18rem);
  height: 100%;
  position: relative;
}

.photostrip-window {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius-card);
}

.photostrip-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  display: block;
  will-change: transform;
}

.photostrip-img img {
  display: block;
  width: 100%;
  height: auto;
}

/* ─── Mobile fallback (below sm) ─── */
.company-illustrated-mobile__details p {
  margin: 0 0 0.5em;
}

.company-illustrated-mobile__details ul {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.5em 0 0;
  color: var(--color-muted);
  line-height: 1.6;
}

.company-illustrated-mobile__details li + li {
  margin-top: 0.4em;
}
```

- [ ] **Step 4: Wire into index.astro**

Edit `src/pages/index.astro`. Add a new `CompanyIllustrated` import line alongside the existing section imports (keep the existing `CompanySection` import — it's still used for companies without the new layout, e.g. Calla Curve). The imports block becomes:

```astro
import ProjectMediaSide from '../components/sections/ProjectMediaSide.astro';
import ProjectFullWidth from '../components/sections/ProjectFullWidth.astro';
import ProjectIllustrated from '../components/sections/ProjectIllustrated.astro';
import CompanySection from '../components/sections/CompanySection.astro';
import CompanyIllustrated from '../components/sections/CompanyIllustrated.astro';
import PortfolioImageGrid from '../components/sections/PortfolioImageGrid.astro';
import PortfolioTrackList from '../components/sections/PortfolioTrackList.astro';
```

Then find the companies section:

```astro
  <section id="companies" class="scroll-mt-20">
    {companies.map((company) => (
      <CompanySection
        id={`company-${company.id}`}
        label={company.data.label}
        title={company.data.title}
        tagline={company.data.tagline}
        position={company.data.position}
        timeline={company.data.timeline}
        highlights={company.data.highlights}
      />
    ))}
  </section>
```

Replace it with:

```astro
  <section id="companies" class="scroll-mt-20">
    {companies.map((company) =>
      company.data.layout === 'illustrated-capsule' ? (
        <CompanyIllustrated
          id={`company-${company.id}`}
          assetDir={company.data.assetDir ?? company.id}
          label={company.data.label}
          title={company.data.title}
          tagline={company.data.tagline}
          position={company.data.position}
          timeline={company.data.timeline}
          highlights={company.data.highlights}
          photostripPosition={company.data.photostripPosition ?? 'right'}
          logoAlt={company.data.logoAlt ?? `${company.data.title} logo`}
          links={company.data.links ?? []}
        />
      ) : (
        <CompanySection
          id={`company-${company.id}`}
          label={company.data.label}
          title={company.data.title}
          tagline={company.data.tagline}
          position={company.data.position}
          timeline={company.data.timeline}
          highlights={company.data.highlights}
        />
      )
    )}
  </section>
```

- [ ] **Step 5: Verify types**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Verify in the browser (desktop)**

Start the dev server (`npm run dev`) and open it in the Browser pane. Navigate to `#company-chloefriendly` and `#company-sewciety` (or scroll to the Companies section).

Expected, for each:
- The watercolor background, capsule machine, logo, title, tagline, link buttons, and selfie/frame image all render without broken-image icons.
- ChloeFriendly: capsule machine on the left, photo strip on the right (real crochet photos). Sewciety: photo strip on the left (blank placeholder frames — that's the actual current art, not a bug), capsule machine on the right.
- Hovering the capsule machine's small capsule sprite swaps `capsule-closed.png` for `capsule-open.png`. Clicking it grows a text panel showing the company's real Position/Timeline/Highlights text over the machine's dome area; clicking again collapses it.
- Hovering a link button or the selfie image grows it slightly (`.hover-expand`).

Use `read_page` / `javascript_tool` (e.g. `document.querySelector('.capsule-hit').classList.contains('expanded')`) to confirm state changes rather than relying solely on screenshots, per this repo's known Browser-pane screenshot/rAF flakiness.

- [ ] **Step 7: Verify the mobile fallback**

Use `resize_window` with the `mobile` preset (375×812). Confirm `.company-illustrated-pin` is not visible and `.company-illustrated-mobile` renders instead — plain label/title/tagline/position/timeline/highlights/links text, no capsule machine, no photo strip.

- [ ] **Step 8: Commit**

```bash
git add src/components/sections/illustrated/PhotoStrip.astro src/components/sections/CompanyIllustrated.astro src/styles/global.css src/pages/index.astro
git commit -m "Add CompanyIllustrated section with capsule machine and photo strip"
```

---

### Task 5: Photo strip scroll-pin behavior

**Files:**
- Modify: `src/components/sections/CompanyIllustrated.astro` (add `<script>`)
- Modify: `src/styles/global.css` (add `prefers-reduced-motion` override)

**Interfaces:**
- Consumes: `.company-illustrated-section` / `.company-illustrated-pin` / `.photostrip-img` DOM structure from Task 4; the site's fixed nav (`<header>` in `Nav.astro`, `position: fixed`) to measure the sticky offset.
- Produces: at runtime, `.company-illustrated-section` gets an inline `height: calc(100vh + <extraScroll>px)`; `.photostrip-img` gets an inline `transform: translateY(<n>px)` driven by scroll position.

- [ ] **Step 1: Add the scroll-pin script**

Edit `src/components/sections/CompanyIllustrated.astro`. Add this `<script>` block after the closing `</section>` tag (same placement convention as `BlindBox.astro`'s script after its markup):

```astro
<script>
  // ─── PHOTO STRIP SCROLL-PIN ───
  // Each `.company-illustrated-section` is a tall wrapper; `.company-
  // illustrated-pin` sticks to the top of the viewport (position: sticky)
  // while the wrapper's extra height is scrolled through, and
  // `.photostrip-img` translates up inside its own clipped
  // `.photostrip-window` in lockstep — giving the effect of the whole
  // section holding still while just the strip scrolls. This is native
  // scroll physics (sticky positioning + reading scrollY), not a
  // wheel/touch preventDefault scroll-lock, which breaks trackpad
  // momentum, keyboard scrolling, and touch, and needs fragile manual
  // re-dispatching of "pass-through" scroll once done.
  //
  // Skipped entirely under prefers-reduced-motion (no extra scroll
  // height reserved, no forced motion) — see the
  // `@media (prefers-reduced-motion: reduce)` override in global.css,
  // which instead makes `.photostrip-window` a normal scrollable box so
  // the rest of the strip is still reachable.
  //
  // Also naturally a no-op below the `sm` breakpoint: `.company-
  // illustrated-pin` is `hidden` there (Tailwind), so `pin.offsetParent`
  // is `null` and `measure()` skips reserving any extra scroll height —
  // matching the plain stacked-text mobile fallback, which needs the
  // section to be its normal (untalled) height.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('.company-illustrated-section'));

  if (sections.length && !prefersReducedMotion) {
    const navEl = document.querySelector<HTMLElement>('header');
    const navHeight = navEl ? navEl.getBoundingClientRect().height : 0;

    interface PinnedStrip {
      section: HTMLElement;
      stripImg: HTMLElement;
      sectionTop: number; // document-relative top, cached at measure time
      extraScroll: number;
    }

    let strips: PinnedStrip[] = [];

    const measure = () => {
      strips = [];
      sections.forEach((section) => {
        const pin = section.querySelector<HTMLElement>('.company-illustrated-pin');
        const stripImg = section.querySelector<HTMLElement>('.photostrip-img');

        section.style.removeProperty('height');
        stripImg?.style.removeProperty('transform');

        if (!pin || !stripImg || pin.offsetParent === null) return;

        const pinHeight = pin.getBoundingClientRect().height;
        const stripHeight = stripImg.getBoundingClientRect().height;
        const extraScroll = Math.max(0, stripHeight - pinHeight);
        if (extraScroll === 0) return;

        section.style.height = `calc(100vh + ${extraScroll}px)`;
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        strips.push({ section, stripImg, sectionTop, extraScroll });
      });
    };

    const applyScroll = () => {
      strips.forEach(({ stripImg, sectionTop, extraScroll }) => {
        const progress = Math.min(1, Math.max(0, (window.scrollY + navHeight - sectionTop) / extraScroll));
        stripImg.style.transform = `translateY(${(-progress * extraScroll).toFixed(1)}px)`;
      });
    };

    let rafId: number | null = null;
    const scheduleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        applyScroll();
      });
    };

    measure();
    applyScroll();

    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      applyScroll();
    });
  }
</script>
```

- [ ] **Step 2: Add the reduced-motion CSS override**

Append to `src/styles/global.css`, directly after the `.photostrip-img img` rule added in Task 4:

```css

@media (prefers-reduced-motion: reduce) {
  .photostrip-window {
    overflow-y: auto;
  }

  .photostrip-img {
    position: static !important;
    transform: none !important;
  }
}
```

- [ ] **Step 3: Verify types**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Verify the scroll-pin in the browser**

With the dev server running, navigate to a company section (e.g. `#company-chloefriendly`) and scroll down slowly through it.

Expected:
- While scrolling through the section's extra height, the title/capsule/buttons/logo stay visually fixed in place (the whole `.company-illustrated-pin` holds still) while only the photo strip's image content visibly moves upward inside its window.
- Once the strip has fully scrolled (its bottom has come into view), continuing to scroll moves on to the next page section normally.

Verify the underlying state via `javascript_tool` rather than trusting a single screenshot mid-scroll (per this repo's known Browser-pane screenshot/rAF flakiness — screenshots taken right after scroll/resize are frequently blank or stale):
```js
const img = document.querySelector('#company-chloefriendly .photostrip-img');
img.style.transform
```
Expected: a `translateY(...)` value that changes as `window.scrollY` changes while inside the pinned range, and stays at `translateY(0px)` before entering the section / at the full negative value after fully scrolling past it.

Also confirm the section's reserved height:
```js
document.querySelector('#company-chloefriendly').style.height
```
Expected: a `calc(100vh + <n>px)` string with `<n> > 0` (assuming the photo strip's rendered height exceeds the pin's viewport height at the current window size — if the two are close, `<n>` may be small; that's fine as long as it's non-negative and the transform above changes with scroll).

- [ ] **Step 5: Verify the reduced-motion fallback (code review)**

This environment's Browser pane has no direct `prefers-reduced-motion` emulation control, so verify this by re-reading the two changed blocks (the script's `prefersReducedMotion` early-return in Step 1, and the media-query override in Step 2) and confirming:
- When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is `true`, the entire `if (sections.length && !prefersReducedMotion)` block is skipped, so no section gets an inline `height` and no `.photostrip-img` gets an inline `transform`.
- The CSS override makes `.photostrip-window` scrollable and forces `.photostrip-img` to `position: static`, so the full strip is reachable by the user's own scrolling within that window even without the pin/transform script running.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/CompanyIllustrated.astro src/styles/global.css
git commit -m "Add photo strip scroll-pin behavior"
```

---

### Task 6: Final cross-check

**Files:** none (verification only)

**Interfaces:** none — this task only exercises the surface built by Tasks 1–5.

- [ ] **Step 1: Full type/schema check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 2: Production build sanity check**

Run: `npm run build`
Expected: build completes without errors (confirms no server-only rendering issues in `CompanyIllustrated.astro`/`CapsuleMachine.astro`/`PhotoStrip.astro`).

- [ ] **Step 3: Side-by-side visual comparison against the provided mockups**

With the dev server running, screenshot both `#company-chloefriendly` and `#company-sewciety` at desktop width (`resize_window` to the `desktop` preset, 1280×800) and compare against the two mockup images provided at the start of this feature (Sewciety: title/buttons/capsule machine on the right, photo strip placeholder frames on the left, decorative blue frame near the capsule; ChloeFriendly: bunny logo/title/buttons/selfie in the middle, capsule/gashapon machine on the left, real crochet photos in the strip on the right). Confirm the overall composition matches (exact pixel positions are not required — the design intentionally uses flexbox, not a pixel-matched canvas — but left/right ordering, relative sizing, and which art appears where should match).

- [ ] **Step 4: Confirm Reverielle/Compositwin are unaffected**

Screenshot or `get_page_text` the `#project-reverielle` and `#project-compositwin` sections and confirm they render exactly as before (blind box hover/click still works, carousels still work) — this plan's changes are additive (new schema fields are `.optional()`, new components are new files) and shouldn't touch their rendering, but this step confirms no regression slipped in via the shared `global.css` edits.

- [ ] **Step 5: Confirm Calla Curve (hidden, plain layout) is unaffected**

`grep -n "layout" src/content/companies/calla.json` — expected: no output (the field was never added to it), confirming it still renders through the original `CompanySection.astro` path unchanged.
