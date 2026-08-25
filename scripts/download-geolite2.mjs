#!/usr/bin/env node
/**
 * Laddar ner MaxMind GeoLite2-City och lägger .mmdb-filen i `geodata/`.
 *
 * Körs som:
 *   npm run geo:download            -> hårt fel om något saknas (lokal setup)
 *   npm run geo:download -- --optional  -> varnar och avslutar 0 (används av prebuild)
 *
 * Krav: ett gratis MaxMind-konto. Sätt MAXMIND_ACCOUNT_ID och
 * MAXMIND_LICENSE_KEY (Vercel: Project Settings -> Environment Variables,
 * lokalt: .env.local).
 *
 * Varför egen tar-parser i stället för `tar`-paketet: build-hosten (Appflow och
 * Vercel) ska inte behöva ännu ett npm-beroende för en engångsuppackning, och
 * `tar`-binären finns inte garanterat på alla Windows-maskiner. Arkivet från
 * MaxMind innehåller bara en handfull filer med korta namn, så en enkel
 * USTAR-läsare räcker.
 */

import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EDITION_ID = "GeoLite2-City";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_DIR = path.join(ROOT, "geodata");
const TARGET_FILE = path.join(TARGET_DIR, `${EDITION_ID}.mmdb`);

const optional = process.argv.includes("--optional");

/**
 * Scriptet körs med rå `node`, utan Next.js env-laddning. På Vercel kommer
 * variablerna från plattformen; lokalt ligger de i .env.local. Vi plockar bara
 * MAXMIND_*-nycklarna, och bara om de inte redan är satta i miljön.
 */
function loadMaxmindEnvFromDotfiles() {
  for (const file of [".env.local", ".env"]) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(MAXMIND_[A-Z_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

loadMaxmindEnvFromDotfiles();

function bail(message) {
  if (optional) {
    console.warn(`[geolite2] ${message} — hoppar över nedladdningen.`);
    console.warn(
      "[geolite2] Analytics fortsätter fungera, men stad slås inte upp lokalt.",
    );
    process.exit(0);
  }
  console.error(`[geolite2] ${message}`);
  process.exit(1);
}

const licenseKey = process.env.MAXMIND_LICENSE_KEY?.trim();
const accountId = process.env.MAXMIND_ACCOUNT_ID?.trim();

if (!licenseKey) {
  bail("MAXMIND_LICENSE_KEY saknas");
}

/**
 * Nya endpointen tar Basic auth (konto-id + licensnyckel). Den äldre
 * `geoip_download`-URL:en tar bara licensnyckeln och används när konto-id
 * inte är satt, så att befintliga nycklar fortsätter fungera.
 */
function buildRequest() {
  if (accountId) {
    return {
      url: `https://download.maxmind.com/geoip/databases/${EDITION_ID}/download?suffix=tar.gz`,
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountId}:${licenseKey}`).toString("base64")}`,
      },
    };
  }

  const params = new URLSearchParams({
    edition_id: EDITION_ID,
    license_key: licenseKey,
    suffix: "tar.gz",
  });
  return {
    url: `https://download.maxmind.com/app/geoip_download?${params.toString()}`,
    headers: {},
  };
}

/** Minimal USTAR-läsare: returnerar första posten vars namn matchar. */
function extractFromTar(tarBuffer, predicate) {
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);

    // Två tomma block i rad = slut på arkivet.
    if (header.every((byte) => byte === 0)) break;

    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const sizeField = header.subarray(124, 136).toString("utf8").replace(/\0.*$/, "").trim();
    const size = parseInt(sizeField, 8) || 0;
    const typeFlag = String.fromCharCode(header[156]);

    const dataStart = offset + 512;
    const dataEnd = dataStart + size;

    // '0' och '\0' = vanlig fil.
    if ((typeFlag === "0" || typeFlag === "\0") && predicate(name)) {
      return { name, data: tarBuffer.subarray(dataStart, dataEnd) };
    }

    // Innehållet paddas upp till närmaste 512-block.
    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  return null;
}

async function main() {
  const { url, headers } = buildRequest();

  console.log(`[geolite2] Hämtar ${EDITION_ID}...`);

  let response;
  try {
    response = await fetch(url, { headers, redirect: "follow" });
  } catch (error) {
    bail(`Nedladdningen misslyckades: ${error instanceof Error ? error.message : error}`);
    return;
  }

  if (!response.ok) {
    const hint =
      response.status === 401
        ? " (kontrollera MAXMIND_ACCOUNT_ID / MAXMIND_LICENSE_KEY)"
        : "";
    bail(`MaxMind svarade ${response.status} ${response.statusText}${hint}`);
    return;
  }

  const archive = Buffer.from(await response.arrayBuffer());
  console.log(`[geolite2] Laddade ner ${(archive.length / 1024 / 1024).toFixed(1)} MB`);

  let tarBuffer;
  try {
    tarBuffer = gunzipSync(archive);
  } catch (error) {
    bail(`Kunde inte packa upp arkivet: ${error instanceof Error ? error.message : error}`);
    return;
  }

  const entry = extractFromTar(tarBuffer, (name) => name.endsWith(".mmdb"));
  if (!entry) {
    bail("Hittade ingen .mmdb-fil i arkivet");
    return;
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });
  fs.writeFileSync(TARGET_FILE, entry.data);

  const checksum = createHash("md5").update(entry.data).digest("hex");
  console.log(
    `[geolite2] Skrev ${path.relative(ROOT, TARGET_FILE)} ` +
      `(${(entry.data.length / 1024 / 1024).toFixed(1)} MB, md5 ${checksum.slice(0, 12)})`,
  );
}

main().catch((error) => {
  bail(`Oväntat fel: ${error instanceof Error ? error.stack : String(error)}`);
});
