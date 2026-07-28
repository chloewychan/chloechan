#!/usr/bin/env node
// Generates responsive AVIF/WebP/PNG assets for the hero section from the
// raw source art in assets/hero-source/ (kept out of public/ since only the
// generated output needs to ship). Run whenever background.PNG or any file
// in assets/hero-source/sprites/ changes.
//
// Usage:  node scripts/optimize-images.mjs
// Requires: npm install sharp  (devDependency, already in package.json)

import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const HERO_SOURCE_DIR = join(ROOT, 'assets', 'hero-source');
const SPRITES_DIR = join(HERO_SOURCE_DIR, 'sprites');
const OUT_DIR = join(ROOT, 'public', 'images', 'hero');
const OUT_SPRITES_DIR = join(OUT_DIR, 'sprites');

const BACKGROUND_WIDTHS = [800, 1200, 1600, 2400, 3200, 4096];
const AVIF_OPTS = { quality: 55, effort: 4 };
const WEBP_OPTS = { quality: 78, effort: 4 };
const PNG_OPTS = { compressionLevel: 9, palette: true };

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function buildResponsiveSet(srcPath, outDir, baseName, widths) {
  ensureDir(outDir);
  for (const width of widths) {
    const resized = sharp(srcPath).resize({ width, withoutEnlargement: true });
    await resized.clone().avif(AVIF_OPTS).toFile(join(outDir, `${baseName}-${width}.avif`));
    await resized.clone().webp(WEBP_OPTS).toFile(join(outDir, `${baseName}-${width}.webp`));
    await resized.clone().png(PNG_OPTS).toFile(join(outDir, `${baseName}-${width}.png`));
    process.stdout.write(`  ${baseName}-${width}.{avif,webp,png}\n`);
  }
}

async function buildNativeSet(srcPath, outDir, baseName) {
  ensureDir(outDir);
  const img = sharp(srcPath);
  await img.clone().avif(AVIF_OPTS).toFile(join(outDir, `${baseName}.avif`));
  await img.clone().webp(WEBP_OPTS).toFile(join(outDir, `${baseName}.webp`));
  await img.clone().png(PNG_OPTS).toFile(join(outDir, `${baseName}.png`));
  process.stdout.write(`  ${baseName}.{avif,webp,png}\n`);
}

async function main() {
  console.log('Optimizing hero background (responsive widths)...');
  const bgPath = join(HERO_SOURCE_DIR, 'background.PNG');
  if (existsSync(bgPath)) {
    await buildResponsiveSet(bgPath, OUT_DIR, 'background', BACKGROUND_WIDTHS);
  } else {
    console.warn('  assets/hero-source/background.PNG not found, skipping.');
  }

  console.log('Optimizing hero sprites (native size, multi-format)...');
  if (existsSync(SPRITES_DIR)) {
    const files = readdirSync(SPRITES_DIR).filter((f) => /\.png$/i.test(f));
    for (const file of files) {
      const baseName = basename(file, extname(file));
      await buildNativeSet(join(SPRITES_DIR, file), OUT_SPRITES_DIR, baseName);
    }
  } else {
    console.warn('  assets/hero-source/sprites/ not found, skipping.');
  }

  console.log('Done. Output in public/images/hero/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
