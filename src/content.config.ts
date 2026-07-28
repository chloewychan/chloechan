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
    // 'media-side': content column + a placeholder media box beside it
    //               (Reverielle, Compositwin)
    // 'full-width': header spans full width, carousel + reveal-box below
    //               (Video Game, Emojify)
    layout: z.enum(['media-side', 'full-width']),
    role: z.string(),
    timeline: z.string(),
    technologies: z.string(),
    details: z.string(),
    carouselPlaceholder: z.string(),
    carouselSlides: z.number(),
    // media-side only
    mediaPosition: z.enum(['left', 'right']).optional(),
    mediaPlaceholder: z.string().optional(),
  }),
});

const companies = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/companies' }),
  schema: base.extend({
    position: z.string(),
    timeline: z.string(),
    description: z.string(),
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
