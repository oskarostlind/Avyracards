/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const ROOT_DIR = process.cwd();
const SOURCE_PATH = path.join(ROOT_DIR, "public", "avyra_transparent_v2.jpg");
const OUT_DIR = path.join(ROOT_DIR, "assets");

const ICON_SIZE = 1024;
const SPLASH_SIZE = 2732;

// Threshold for "non-black" pixels. The source is a black background with white logo + text.
const INK_THRESHOLD = 25; // brightness

async function getInkStats(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  if (!width || !height || !channels) {
    throw new Error("Could not read image dimensions/channels");
  }

  const rowInk = new Uint32Array(height);

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    let rowCount = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const brightness = (r + g + b) / 3;

      if (brightness > INK_THRESHOLD) {
        rowCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    rowInk[y] = rowCount;
  }

  return { width, height, channels, data, rowInk, minX, maxX, minY, maxY };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function buildIcon(sourceBuffer) {
  const { width, height, rowInk, minX, maxX, minY, maxY } = await getInkStats(
    sourceBuffer
  );

  if (maxX < minX || maxY < minY) {
    throw new Error("No ink pixels found in source image");
  }

  // Try to find a "valley" between the A and the text AVYRA.
  const bandTop = minY + Math.floor((maxY - minY) * 0.15);
  const bandBottom = maxY - Math.floor((maxY - minY) * 0.15);

  let yCandidate = bandTop;
  let best = rowInk[bandTop] ?? 0;
  for (let y = bandTop; y <= bandBottom; y++) {
    const v = rowInk[y] ?? 0;
    if (v < best) {
      best = v;
      yCandidate = y;
    }
  }

  // Clamp crop bottom so we don't cut off too much of the A.
  const heightRange = maxY - minY;
  const minAccept = minY + Math.floor(heightRange * 0.25);
  const maxAccept = maxY - Math.floor(heightRange * 0.2);
  const aBottom = clamp(yCandidate, minAccept, maxAccept);

  // Recompute ink bbox only in [minY..aBottom] to get A area precisely.
  // (We scan the raw image again for simplicity and determinism.)
  const { data, info } = await sharp(sourceBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels ?? 3;

  let aMinX = width;
  let aMaxX = -1;
  let aMinY = height;
  let aMaxY = -1;

  for (let y = minY; y <= aBottom; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const brightness = (r + g + b) / 3;

      if (brightness > INK_THRESHOLD) {
        if (x < aMinX) aMinX = x;
        if (x > aMaxX) aMaxX = x;
        if (y < aMinY) aMinY = y;
        if (y > aMaxY) aMaxY = y;
      }
    }
  }

  if (aMaxX < aMinX || aMaxY < aMinY) {
    throw new Error("Could not isolate A area for icon crop");
  }

  const pad = Math.max(8, Math.floor(Math.min(width, height) * 0.02));

  const left = clamp(aMinX - pad, 0, width - 1);
  const top = clamp(aMinY - pad, 0, height - 1);
  const cropW = clamp(aMaxX + pad, 0, width - 1) - left + 1;
  const cropH = clamp(aMaxY + pad, 0, height - 1) - top + 1;

  const iconCropBuffer = await sharp(sourceBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(ICON_SIZE, ICON_SIZE, { fit: "contain" })
    .toBuffer();

  const iconBase = sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  return iconBase
    .composite([{ input: iconCropBuffer, gravity: "center" }])
    .png()
    .toBuffer();
}

async function buildSplash(sourceBuffer, meta) {
  const base = sharp({
    create: {
      width: SPLASH_SIZE,
      height: SPLASH_SIZE,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;

  if (!srcW || !srcH) {
    throw new Error("Could not determine source width/height");
  }

  let placedBuffer = sourceBuffer;
  // If the source is larger than the splash, scale it down to avoid any cropping.
  if (srcW > SPLASH_SIZE || srcH > SPLASH_SIZE) {
    const scale = Math.min(SPLASH_SIZE / srcW, SPLASH_SIZE / srcH);
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));
    placedBuffer = await sharp(sourceBuffer)
      .resize(targetW, targetH, { fit: "contain" })
      .toBuffer();
  }

  return base.composite([{ input: placedBuffer, gravity: "center" }]).png().toBuffer();
}

async function main() {
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });

    const sourceBuffer = await fs.readFile(SOURCE_PATH);
    const meta = await sharp(sourceBuffer).metadata();

    const iconBuffer = await buildIcon(sourceBuffer);
    const splashBuffer = await buildSplash(sourceBuffer, meta);

    await fs.writeFile(path.join(OUT_DIR, "icon.png"), iconBuffer);
    await fs.writeFile(path.join(OUT_DIR, "splash.png"), splashBuffer);

    const iconMeta = await sharp(iconBuffer).metadata();
    const splashMeta = await sharp(splashBuffer).metadata();

    console.log("Generated:");
    console.log(`- assets/icon.png (${iconMeta.width}x${iconMeta.height})`);
    console.log(`- assets/splash.png (${splashMeta.width}x${splashMeta.height})`);
  } catch (e) {
    console.error("generate-assets.js failed:", e);
    process.exit(1);
  }
}

void main();

