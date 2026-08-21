#!/usr/bin/env node
/**
 * Set the Foundry system version in every file that must stay in lockstep.
 *
 * Usage:
 *   node scripts/set-release-version.mjs 0.9.405
 *
 * Updates:
 *   package.json version
 *   system.json version
 *   system.json download (GitHub Release ZIP)
 *   docs/catalog-audit.json version (if present)
 *
 * Does not edit CHANGELOG.md — add the heading yourself before tagging.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function fail(msg) {
  console.error(`set-release-version: ${msg}`);
  process.exit(1);
}

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail('Usage: node scripts/set-release-version.mjs X.Y.Z');
}

const download = `https://github.com/Destroyed-Faith/masterySystem/releases/download/v${version}/mastery-system-${version}.zip`;

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

function writeJson(rel, data) {
  writeFileSync(join(root, rel), `${JSON.stringify(data, null, 2)}\n`);
}

const pkg = readJson('package.json');
pkg.version = version;
writeJson('package.json', pkg);

const sys = readJson('system.json');
sys.version = version;
sys.download = download;
writeJson('system.json', sys);

const auditRel = 'docs/catalog-audit.json';
if (existsSync(join(root, auditRel))) {
  const audit = readJson(auditRel);
  audit.version = version;
  writeJson(auditRel, audit);
}

console.log(`set-release-version: ${version}`);
console.log(`  package.json version`);
console.log(`  system.json version`);
console.log(`  system.json download = ${download}`);
if (existsSync(join(root, auditRel))) {
  console.log(`  docs/catalog-audit.json version`);
}
console.log(`Add CHANGELOG.md heading ## [${version}] before tagging.`);
