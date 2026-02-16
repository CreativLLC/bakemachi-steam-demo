#!/usr/bin/env node
/**
 * Trim transparent padding from all character sprite PNGs.
 *
 * Finds the tightest bounding box across ALL frames (idle + running)
 * so every frame shares the same dimensions — no animation jitter.
 *
 * Usage:  node scripts/trim-sprites.mjs <sprite-folder>
 * Example: node scripts/trim-sprites.mjs public/assets/sprites/main-male
 *
 * Overwrites PNGs in place (back up first if nervous).
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const spriteDir = process.argv[2];
if (!spriteDir) {
  console.error('Usage: node scripts/trim-sprites.mjs <sprite-folder>');
  process.exit(1);
}

/** Recursively collect all .png files under a directory */
async function collectPngs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectPngs(full));
    } else if (entry.name.toLowerCase().endsWith('.png')) {
      files.push(full);
    }
  }
  return files;
}

/** Get the bounding box of non-transparent pixels in a PNG */
async function getBounds(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 0) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) return null;
  return { minX, minY, maxX, maxY };
}

async function main() {
  const resolvedDir = path.resolve(spriteDir);
  const files = await collectPngs(resolvedDir);

  if (files.length === 0) {
    console.log('No PNG files found in', resolvedDir);
    return;
  }

  console.log(`Found ${files.length} PNGs in ${resolvedDir}`);

  // Pass 1: find union bounding box across ALL frames
  let unionMinX = Infinity, unionMinY = Infinity;
  let unionMaxX = 0, unionMaxY = 0;
  let sourceWidth = 0, sourceHeight = 0;

  for (const file of files) {
    const bounds = await getBounds(file);
    if (!bounds) continue;

    const meta = await sharp(file).metadata();
    sourceWidth = meta.width;
    sourceHeight = meta.height;

    if (bounds.minX < unionMinX) unionMinX = bounds.minX;
    if (bounds.minY < unionMinY) unionMinY = bounds.minY;
    if (bounds.maxX > unionMaxX) unionMaxX = bounds.maxX;
    if (bounds.maxY > unionMaxY) unionMaxY = bounds.maxY;
  }

  const cropW = unionMaxX - unionMinX + 1;
  const cropH = unionMaxY - unionMinY + 1;

  console.log(`Source size: ${sourceWidth}x${sourceHeight}`);
  console.log(`Union bounds: (${unionMinX},${unionMinY}) to (${unionMaxX},${unionMaxY})`);
  console.log(`Trimmed size: ${cropW}x${cropH} (saved ${sourceWidth * sourceHeight - cropW * cropH} pixels)`);

  // Pass 2: crop all files to the union box
  let processed = 0;
  for (const file of files) {
    await sharp(file)
      .extract({ left: unionMinX, top: unionMinY, width: cropW, height: cropH })
      .toBuffer()
      .then(buf => sharp(buf).toFile(file));
    processed++;
  }

  console.log(`Trimmed ${processed} files to ${cropW}x${cropH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
