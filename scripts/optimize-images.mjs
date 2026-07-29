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
import { fileURLToPath } from 'url';

// `new URL(...).pathname` percent-encodes characters like spaces, and fs
// functions don't decode that back — breaks on any path containing a space
// (e.g. this repo's "Mobile Documents" iCloud folder). fileURLToPath decodes
// it correctly.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HERO_SOURCE_DIR = join(ROOT, 'assets', 'hero-source');
const SPRITES_DIR = join(HERO_SOURCE_DIR, 'sprites');
const OUT_DIR = join(ROOT, 'public', 'images', 'hero');
const OUT_SPRITES_DIR = join(OUT_DIR, 'sprites');

// Illustrated project sections (Reverielle, Compositwin, ...): every PNG in
// assets/<id>-source/ is a full 4096x1714 canvas layer — background, blind
// box states, buttons, photo — meant to be stacked with inset:0 so they line
// up without any per-layer positioning math. assets/general-source/ holds
// shared pieces (e.g. the carousel arrow) reused across projects.
const ASSETS_DIR = join(ROOT, 'assets');
const PROJECTS_OUT_DIR = join(ROOT, 'public', 'images', 'projects');
const GENERAL_SOURCE_DIR = join(ASSETS_DIR, 'general-source');
const GENERAL_OUT_DIR = join(ROOT, 'public', 'images', 'general');

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

// Same as buildNativeSet, but trims the transparent padding first. Most
// illustrated-project layers (background, blind box states, photo) are
// exported on a shared full-canvas so they stay aligned when stacked with
// inset:0 — but standalone pieces like the link buttons and the carousel
// arrow are just small graphics on that same oversized canvas, and
// rendering them at their small display size would scale the whole
// (mostly transparent) canvas down to near-invisibility. Trimming makes
// them normal appropriately-sized images.
async function buildTrimmedNativeSet(srcPath, outDir, baseName) {
  ensureDir(outDir);
  const img = sharp(srcPath).trim({ threshold: 5 });
  await img.clone().avif(AVIF_OPTS).toFile(join(outDir, `${baseName}.avif`));
  await img.clone().webp(WEBP_OPTS).toFile(join(outDir, `${baseName}.webp`));
  await img.clone().png(PNG_OPTS).toFile(join(outDir, `${baseName}.png`));
  process.stdout.write(`  ${baseName}.{avif,webp,png} (trimmed)\n`);
}

// Filenames (without extension) that should be trimmed rather than kept
// at full canvas size — standalone graphics, not alignment-critical layers.
const TRIMMED_BASENAMES = new Set(['button1', 'button2', 'arrow']);

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

  console.log('Optimizing illustrated project sections (native size, multi-format)...');
  const projectDirs = existsSync(ASSETS_DIR)
    ? readdirSync(ASSETS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name.endsWith('-source') && d.name !== 'hero-source' && d.name !== 'general-source')
    : [];
  for (const dir of projectDirs) {
    const id = dir.name.replace(/-source$/, '');
    const srcDir = join(ASSETS_DIR, dir.name);
    const outDir = join(PROJECTS_OUT_DIR, id);
    const files = readdirSync(srcDir).filter((f) => /\.png$/i.test(f));
    for (const file of files) {
      const baseName = basename(file, extname(file));
      const build = TRIMMED_BASENAMES.has(baseName) ? buildTrimmedNativeSet : buildNativeSet;
      await build(join(srcDir, file), outDir, baseName);
    }
  }

  console.log('Optimizing general shared assets (native size, multi-format)...');
  if (existsSync(GENERAL_SOURCE_DIR)) {
    const files = readdirSync(GENERAL_SOURCE_DIR).filter((f) => /\.png$/i.test(f));
    for (const file of files) {
      const baseName = basename(file, extname(file));
      const build = TRIMMED_BASENAMES.has(baseName) ? buildTrimmedNativeSet : buildNativeSet;
      await build(join(GENERAL_SOURCE_DIR, file), GENERAL_OUT_DIR, baseName);
    }
  }

  console.log('Done. Output in public/images/projects/ and public/images/general/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
