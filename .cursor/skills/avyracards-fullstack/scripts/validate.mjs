#!/usr/bin/env node
/**
 * AvyraCards pre-delivery validation.
 * Usage:
 *   node validate.mjs           # lint only
 *   node validate.mjs --prisma  # lint + prisma format
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const includePrisma = process.argv.includes("--prisma");

function findProjectRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "package.json")) && existsSync(resolve(dir, "prisma", "schema.prisma"))) {
      return dir;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const root = findProjectRoot();
process.chdir(root);

console.log(`[avyracards-validate] Project root: ${root}`);

function run(label, command) {
  console.log(`\n[avyracards-validate] ${label}...`);
  try {
    execSync(command, { stdio: "inherit", cwd: root, shell: true });
    console.log(`[avyracards-validate] ${label} passed`);
    return true;
  } catch {
    console.error(`[avyracards-validate] ${label} FAILED`);
    return false;
  }
}

let ok = true;

if (includePrisma) {
  ok = run("Prisma format", "npx prisma format") && ok;
}

ok = run("ESLint", "node --max-old-space-size=4096 node_modules/next/dist/bin/next lint") && ok;

if (!ok) {
  console.error("\n[avyracards-validate] Validation failed. Fix errors before delivering code.");
  process.exit(1);
}

console.log("\n[avyracards-validate] All checks passed.");
