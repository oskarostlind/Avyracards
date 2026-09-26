#!/usr/bin/env node
/**
 * Genererar src/styles/profile-fonts.css ur @fontsource-paketen.
 *
 * Varför ett eget skript i stället för att importera paketens index.css:
 *  - Paketen deklarerar alla subset (kyrilliska, grekiska, vietnamesiska …).
 *    Vi vill bara ha latin + latin-ext (åäö ligger i latin) så att CSS:en
 *    hålls liten.
 *  - Variabla paket saknar per-subset-CSS; vi plockar ut rätt block ur wght.css.
 *  - Inga kursiver: profilerna använder dem inte, och varje extra @font-face
 *    är bytes i CSS:en.
 *
 * Filerna refereras med `~paket/...` så att webpack kopierar dem till
 * /_next/static/media med innehållshash (långtidscache). Allt serveras från
 * vår egen domän — inget Google Fonts-CDN (GDPR + App Review-uppgiften att
 * ingen data delas med tredje part).
 *
 * Kör efter att ett @fontsource-paket lagts till/uppgraderats:
 *   node scripts/generate-profile-fonts-css.mjs
 * Katalogen (id, namn, premium) ligger i src/lib/theme/fonts.ts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// [paket, css-fil(er) att läsa]. Variabla: wght.css. Statiska: valda vikter.
const VARIABLE = [
  "inter", "roboto", "space-grotesk", "dm-sans", "montserrat", "manrope", "outfit", "sora",
  "plus-jakarta-sans", "figtree", "archivo", "nunito", "quicksand", "comfortaa",
  "playfair-display", "lora", "merriweather", "fraunces", "cormorant-garamond", "eb-garamond",
  "libre-baskerville", "oswald", "syne", "bricolage-grotesque", "unbounded", "caveat",
  "dancing-script", "jetbrains-mono",
];

const STATIC = {
  poppins: [400, 500, 600, 700],
  "dm-serif-display": [400],
  "instrument-serif": [400],
  "bebas-neue": [400],
  anton: [400],
  righteous: [400],
  "abril-fatface": [400],
  pacifico: [400],
  satisfy: [400],
  "great-vibes": [400],
  "permanent-marker": [400],
  "space-mono": [400, 700],
  "ibm-plex-mono": [400, 500, 600, 700],
};

const SUBSET_RE = /\/\* [a-z0-9-]+-(latin|latin-ext)-(?:wght|\d{3})-normal \*\//;

/** Plocka ut @font-face-block (inkl. kommentaren före) för latin/latin-ext. */
function extractBlocks(css, pkgPath, unicode) {
  const out = [];
  const re = /(\/\*[^*]*\*\/)\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css))) {
    const subset = SUBSET_RE.exec(m[1])?.[1];
    if (!subset) continue;
    let block = m[2]
      // Endast woff2 — alla webbläsare vi stöder (iOS 15+) klarar det.
      .replace(/,\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "")
      .replace(/url\(\.\/files\//g, `url(~${pkgPath}/files/`);
    if (!/font-display:\s*swap/.test(block)) {
      block = block.replace("{", "{\n  font-display: swap;");
    }
    // Paketens per-subset-filer (latin-400.css) saknar unicode-range. Utan den
    // hämtar webbläsaren BÅDE latin- och latin-ext-filen för varje familj.
    if (!/unicode-range/.test(block)) {
      const range = unicode[subset];
      if (!range) throw new Error(`Saknar unicode-range för ${pkgPath} ${subset}`);
      block = block.replace(/\n\}$/, `\n  unicode-range: ${range};\n}`);
    }
    out.push(`${m[1]}\n${block}`);
  }
  return out;
}

function readUnicode(pkg) {
  return JSON.parse(readFileSync(join(root, "node_modules", pkg, "unicode.json"), "utf8"));
}

const blocks = [];
for (const name of VARIABLE) {
  const pkg = `@fontsource-variable/${name}`;
  const css = readFileSync(join(root, "node_modules", pkg, "wght.css"), "utf8");
  const found = extractBlocks(css, pkg, readUnicode(pkg));
  if (found.length === 0) throw new Error(`Inga latin-block i ${pkg}`);
  blocks.push(...found);
}
for (const [name, weights] of Object.entries(STATIC)) {
  const pkg = `@fontsource/${name}`;
  for (const w of weights) {
    for (const subset of ["latin-ext", "latin"]) {
      let css;
      try {
        css = readFileSync(join(root, "node_modules", pkg, `${subset}-${w}.css`), "utf8");
      } catch {
        continue; // vissa typsnitt (t.ex. Satisfy) saknar latin-ext
      }
      blocks.push(...extractBlocks(css, pkg, readUnicode(pkg)));
    }
  }
}

const header = `/*
 * GENERERAD FIL — redigera inte för hand.
 * Källa: scripts/generate-profile-fonts-css.mjs (katalog: src/lib/theme/fonts.ts)
 *
 * Självhostade profiltypsnitt (@fontsource, OFL/Apache). Bara latin + latin-ext.
 * @font-face-regler är billiga: webbläsaren hämtar en fil först när en text på
 * sidan faktiskt använder familjen (och tecknen ligger i filens unicode-range).
 */
`;

writeFileSync(join(root, "src/styles/profile-fonts.css"), `${header}\n${blocks.join("\n\n")}\n`);
console.log(`profile-fonts.css: ${blocks.length} @font-face-regler`);
