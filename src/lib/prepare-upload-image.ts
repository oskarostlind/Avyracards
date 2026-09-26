/**
 * Förbereder en bild för uppladdning som profilbakgrund.
 *
 * Varför: uppladdningen skickade originalfilen orörd och nekade allt över
 * 4 MB (Vercels request-gräns är ~4,5 MB). Moderna iPhone-foton är ofta
 * 4–8 MB, så användare fick "för stor" och tog till skärmdumpar eller
 * hårt komprimerade bilder — med för få pixlar för en helskärmsbakgrund.
 *
 * Nu: stora bilder skalas ner i webbläsaren till max LONG_SIDE px och kodas
 * om som JPEG i hög kvalitet. 2560 px räcker med marginal för en iPhone-skärm
 * (≈1290 px bred @3x) även när bilden beskärs av `cover`, och landar typiskt
 * på 0,6–2 MB. Små bilder skickas orörda (ingen onödig omkodning).
 */

export const LONG_SIDE = 2560;
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024; // under Vercels body-gräns
export const INPUT_MAX_BYTES = 40 * 1024 * 1024; // rimligt tak för vad vi tar emot från väljaren

export type PreparedUpload = { blob: Blob; filename: string; width?: number; height?: number; resized: boolean };

export class ImageTooLargeError extends Error {}

/** Ren beräkning (testbar): målstorlek som behåller proportionerna. */
export function fitWithin(width: number, height: number, longSide = LONG_SIDE) {
  const scale = Math.min(1, longSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale };
}

function replaceExtension(name: string, ext: string) {
  const base = name.replace(/\.[^/.]+$/, "") || "bakgrund";
  return `${base}.${ext}`;
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  // createImageBitmap respekterar EXIF-rotation (iPhone-foton) och avkodar utanför huvudtråden.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* faller tillbaka på <img> nedan */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Kunde inte läsa bilden"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunde inte koda bilden"))), "image/jpeg", quality),
  );
}

export async function prepareBackgroundImage(file: File): Promise<PreparedUpload> {
  if (file.size > INPUT_MAX_BYTES) throw new ImageTooLargeError();

  // GIF: omkodning skulle döda animationen — skicka orörd om den får plats.
  if (file.type === "image/gif") {
    if (file.size > UPLOAD_MAX_BYTES) throw new ImageTooLargeError();
    return { blob: file, filename: file.name, resized: false };
  }

  const img = await decode(file);
  try {
    const target = fitWithin(img.width, img.height);
    const needsResize = target.scale < 1;

    // Liten nog och i ett format alla webbläsare visar: rör den inte.
    const displayable = /^image\/(jpeg|png|webp)$/.test(file.type);
    if (!needsResize && file.size <= UPLOAD_MAX_BYTES && displayable) {
      return { blob: file, filename: file.name, width: img.width, height: img.height, resized: false };
    }

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    // Svart under ev. transparens (bakgrunden ligger ändå på mörk sida).
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img.source, 0, 0, target.width, target.height);

    // Hög kvalitet först; sänk bara om den (sällan) inte ryms under gränsen.
    for (const q of [0.9, 0.85, 0.78, 0.7]) {
      const blob = await toJpeg(canvas, q);
      if (blob.size <= UPLOAD_MAX_BYTES) {
        return { blob, filename: replaceExtension(file.name, "jpg"), width: target.width, height: target.height, resized: true };
      }
    }
    throw new ImageTooLargeError();
  } finally {
    img.close();
  }
}
