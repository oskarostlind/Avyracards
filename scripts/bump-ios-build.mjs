#!/usr/bin/env node
// Höjer iOS-build-numret (CURRENT_PROJECT_VERSION) i Xcode-projektet.
// CFBundleVersion i Info.plist använder $(CURRENT_PROJECT_VERSION), så detta räcker.
//
// Användning:
//   node scripts/bump-ios-build.mjs           -> +1 från nuvarande högsta värde
//   node scripts/bump-ios-build.mjs --set 20  -> sätt exakt build-nummer
//
// Exit-koder: 0 = ok, 1 = fel (t.ex. inget värde hittat)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pbxprojPath = join(
  __dirname,
  "..",
  "ios",
  "App",
  "App.xcodeproj",
  "project.pbxproj"
);

const VERSION_RE = /CURRENT_PROJECT_VERSION = (\d+);/g;

function parseArgs(argv) {
  const args = { set: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--set") {
      const val = Number(argv[i + 1]);
      if (!Number.isInteger(val) || val < 1) {
        console.error(`[bump-ios-build] Ogiltigt --set värde: ${argv[i + 1]}`);
        process.exit(1);
      }
      args.set = val;
      i++;
    }
  }
  return args;
}

function main() {
  const { set } = parseArgs(process.argv.slice(2));

  let contents;
  try {
    contents = readFileSync(pbxprojPath, "utf8");
  } catch (err) {
    console.error(`[bump-ios-build] Kunde inte läsa ${pbxprojPath}: ${err.message}`);
    process.exit(1);
  }

  const matches = [...contents.matchAll(VERSION_RE)];
  if (matches.length === 0) {
    console.error("[bump-ios-build] Hittade ingen CURRENT_PROJECT_VERSION i project.pbxproj");
    process.exit(1);
  }

  const current = Math.max(...matches.map((m) => Number(m[1])));
  const next = set ?? current + 1;

  if (next <= current && set !== null) {
    console.error(
      `[bump-ios-build] --set ${next} är inte högre än nuvarande ${current}. App Store kräver ett högre build-nummer.`
    );
    process.exit(1);
  }

  const updated = contents.replace(
    VERSION_RE,
    `CURRENT_PROJECT_VERSION = ${next};`
  );
  writeFileSync(pbxprojPath, updated, "utf8");

  console.log(`[bump-ios-build] Build-nummer: ${current} -> ${next}`);
}

main();
