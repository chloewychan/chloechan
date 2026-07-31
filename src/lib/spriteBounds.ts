import sharp from 'sharp';
import { join } from 'node:path';

// Finds the opaque-pixel bounding box of a full-canvas PNG (most of its area
// is transparent, with a small drawn character somewhere inside) as a % of
// the whole canvas. Used to feed --sprite-x/y/w/h (see the "WIGGLE SPRITES"
// section of global.css) so the cursor-magnet engine measures distance
// against where the art actually is, not the element's full (mostly
// transparent) bounding box. Runs at build/dev time only (Astro frontmatter),
// same pattern as scripts/optimize-images.mjs's use of sharp — not shipped
// to the client.
export interface SpriteBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ALPHA_THRESHOLD = 20;
const cache = new Map<string, SpriteBounds>();

// publicPath is a URL path under /public, e.g. "/images/projects/reverielle/selfie.png"
export async function spriteBounds(publicPath: string): Promise<SpriteBounds> {
  const cached = cache.get(publicPath);
  if (cached) return cached;

  // Resolved from process.cwd() rather than import.meta.url: Astro bundles
  // this file for production, so the compiled chunk's URL ends up somewhere
  // under dist/ at build time — a path relative to it no longer points at
  // the real public/ directory (see scripts/optimize-images.mjs's own
  // import.meta.url gotcha for a related case). cwd is reliably the project
  // root in both `astro dev` and `astro build`.
  const filePath = join(process.cwd(), 'public', publicPath);
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bounds: SpriteBounds = {
    x: (minX / width) * 100,
    y: (minY / height) * 100,
    w: ((maxX - minX) / width) * 100,
    h: ((maxY - minY) / height) * 100,
  };

  cache.set(publicPath, bounds);
  return bounds;
}
