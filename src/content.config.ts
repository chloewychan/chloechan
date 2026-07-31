import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Shared by every category: nav label/order and the hide switch that keeps
// an item out of both the nav and the page without deleting it.
const base = z.object({
  title: z.string(),
  tagline: z.string(),
  hidden: z.boolean().default(false),
  order: z.number().default(0),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: base.extend({
    // Overline label above the title — defaults to "Project", but e.g.
    // work-in-progress projects can override it to say so.
    label: z.string().default('Project'),
    // 'media-side':  content column + a placeholder media box beside it
    //                (old simple layout)
    // 'full-width':  header spans full width, carousel + reveal-box below
    //                (old simple layout — Video Game, Emojify)
    // 'illustrated': fully custom hand-drawn scene: background art, a
    //                hover/click "blind box" reveal, link buttons, a photo,
    //                and a placeholder-image carousel (Reverielle, Compositwin)
    layout: z.enum(['media-side', 'full-width', 'illustrated']),
    // Bullet points shown in the reveal-box / blind box — free-form, so
    // each project can list whatever facts actually matter for it
    // (platform, stack, APIs, role, timeline, ...) instead of fixed slots.
    details: z.array(z.string()),

    // media-side / full-width only
    carouselPlaceholder: z.string().optional(),
    carouselSlides: z.number().optional(),
    mediaPosition: z.enum(['left', 'right']).optional(),
    mediaPlaceholder: z.string().optional(),

    // illustrated only — art lives in public/images/projects/<id>/, one
    // full-canvas PNG/AVIF/WebP layer per piece (see Hero.astro's approach)
    websiteUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    blindboxAlt: z.string().optional(),
    // which side the placeholder-image carousel sits on — the illustrated
    // art (blind box/buttons/photo) is baked into the background art on
    // the other side, so this just tells the carousel where to go
    carouselPosition: z.enum(['left', 'right']).optional(),
    // 'expand': arrows cycle which single image in a row is enlarged
    // 'rotate': arrows rotate the stack; the bottom slot stays enlarged
    carouselVariant: z.enum(['expand', 'rotate']).optional(),
    carouselImageCount: z.number().optional(),
    // One caption per placeholder image (index-aligned with
    // carouselImageCount) — the carousel shows only the caption for
    // whichever image is currently active/selected, not all of them at once.
    carouselCaption: z.array(z.string()).optional(),
    // Blind box hit/hover region as a % box (x, y, width, height) on the
    // shared 4096x1714 canvas — matches where this project's hand-drawn
    // blindbox-*.png layers actually sit, so it lives with the content
    // that describes that specific artwork rather than hardcoded in a
    // component that's meant to work for any illustrated project.
    blindboxX: z.number().optional(),
    blindboxY: z.number().optional(),
    blindboxW: z.number().optional(),
    blindboxH: z.number().optional(),
    // Same idea for the "Visit Website" button — its own bbox on the
    // canvas. The GitHub button reuses this position with a fixed
    // vertical offset (see ProjectIllustrated.astro) since in both
    // projects' art it sits directly below at the same offset/size.
    buttonsX: z.number().optional(),
    buttonsY: z.number().optional(),
    buttonsW: z.number().optional(),
    buttonsH: z.number().optional(),
  }),
});

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

const portfolio = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/portfolio' }),
  schema: base.extend({
    // 'image-grid': description + a grid of image placeholders
    // 'track-list': description + a stacked list of tracks
    layout: z.enum(['image-grid', 'track-list']),
    // image-grid only
    imageCount: z.number().optional(),
    imagePlaceholder: z.string().optional(),
    // track-list only
    tracks: z.array(z.object({ title: z.string(), meta: z.string() })).optional(),
  }),
});

export const collections = { projects, companies, portfolio };
