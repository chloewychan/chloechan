# Chloe Chan Portfolio

Personal portfolio site at [chloechan.ca](https://chloechan.ca), built with [Astro](https://astro.build) as a static site.

## Setup

### Prerequisites
- Node.js 22.12+ (required by Astro 7)
- npm

### Installation

```bash
git clone https://github.com/chloewychan/chloechan.git
cd chloechan.ca
npm install
```

Optimized images aren't committed to git (`public/images/` is gitignored — large binaries) and are generated from the raw art in `assets/*-source/`:

```bash
npm run optimize-images
```

Note: the hero's raw source art (`assets/hero-source/`) isn't tracked in git either (it's large), so a fresh clone can't regenerate hero images from scratch — that folder needs to be added locally, or `public/images/hero/` copied in from an existing build.

## Development

```bash
npm run dev
```

The site will be available at `http://localhost:4321`.

## Building

```bash
npm run build
```

Outputs a static site to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Type Checking

```bash
npm run check
```

Runs `astro check` (TypeScript + Astro template diagnostics).

## Deployment

Deploys to Vercel via the CLI, not GitHub-integration auto-deploy — pushing to GitHub does **not** trigger a deploy on its own.

```bash
npx vercel --prod
```

The Vercel CLI isn't installed globally on every machine; `npx vercel@latest <command>` works without a global install. The project is already linked (`.vercel/project.json`) under the `chloechan` project, and the domain's DNS is already pointed at Vercel.

## Project Structure

- `src/pages/index.astro` — the single page; queries content collections and renders the matching section component per item
- `src/content/{projects,companies,portfolio}/` — one JSON file per item; validated by the Zod schemas in `src/content.config.ts`. Add a JSON file to add an item, set `"hidden": true` to hide one from both the nav and the page
- `src/components/` — section components (`ProjectIllustrated.astro`, `CompanySection.astro`, `PortfolioImageGrid.astro`, etc.) and shared pieces (`Hero.astro`, `Nav.astro`, `Footer.astro`)
- `src/components/sections/illustrated/` — the fully hand-drawn Reverielle/Compositwin project scenes (`BlindBox.astro`, `ExpandingCarousel.astro`, `RotatingCarousel.astro`)
- `src/layouts/BaseLayout.astro` — shared page shell, including the site-wide "wiggle sprite" motion engine (scroll inertia + cursor magnet) that drives every `.wiggle-sprite` element, from the hero's characters to the illustrated projects' art
- `src/lib/` — build-time helpers (`wiggleSprite.ts` generates per-sprite motion "personality" from a seed string; `spriteBounds.ts` measures a PNG's opaque-pixel bounding box via `sharp`)
- `src/styles/global.css` — all site styling (Tailwind is loaded via CDN in `BaseLayout.astro`, used for a handful of utility classes only)
- `assets/*-source/` — raw, full-resolution art per section, one 4096×1714 canvas per layer for the hero/illustrated scenes
- `scripts/optimize-images.mjs` — converts `assets/*-source/` into avif/webp/png at appropriate sizes in `public/images/`
- `public/images/projects/<id>/` — optimized art for one illustrated project; a third illustrated project just needs its own art here plus a content JSON file with `"layout": "illustrated"`

## Technologies

- [Astro](https://astro.build) (static output)
- TypeScript
- Tailwind CSS (via CDN)
- [sharp](https://sharp.pixelplumbing.com/) for build-time image optimization
- Deployed on [Vercel](https://vercel.com)
