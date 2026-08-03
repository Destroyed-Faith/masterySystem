#!/usr/bin/env node
/**
 * Fail-fast release version consistency check.
 *
 * Usage:
 *   node scripts/validate-release-version.mjs [--tag vX.Y.Z] [--zip path]
 *
 * When --tag is omitted, validates that package.json and system.json versions match
 * and that CHANGELOG.md contains a heading for that version.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function fail(msg) {
  console.error(`validate-release-version: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { tag: null, zip: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag') out.tag = argv[++i];
    else if (argv[i] === '--zip') out.zip = argv[++i];
  }
  return out;
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

const args = parseArgs(process.argv.slice(2));
const pkg = readJson('package.json');
const sys = readJson('system.json');
const pkgVer = String(pkg.version || '');
const sysVer = String(sys.version || '');

if (!/^\d+\.\d+\.\d+$/.test(pkgVer)) fail(`package.json version not semver X.Y.Z: ${pkgVer}`);
if (pkgVer !== sysVer) fail(`package.json (${pkgVer}) !== system.json (${sysVer})`);

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const headingRe = new RegExp(`^## \\[${pkgVer.replace(/\./g, '\\.')}\\]`, 'm');
if (!headingRe.test(changelog)) {
  fail(`CHANGELOG.md missing heading ## [${pkgVer}]`);
}

if (args.tag) {
  const expectedTag = `v${pkgVer}`;
  if (args.tag !== expectedTag) {
    fail(`Git tag ${args.tag} does not match expected ${expectedTag}`);
  }
}

const expectedZipName = `mastery-system-${pkgVer}.zip`;
if (args.zip) {
  const base = args.zip.split(/[/\\]/).pop();
  if (base !== expectedZipName) {
    fail(`ZIP filename ${base} does not match expected ${expectedZipName}`);
  }
  if (!existsSync(args.zip)) fail(`ZIP not found: ${args.zip}`);
}

const download = String(sys.download || '');
const expectedDownload = `https://github.com/Destroyed-Faith/masterySystem/releases/download/v${pkgVer}/mastery-system-${pkgVer}.zip`;
if (download !== expectedDownload) {
  fail(`system.json download URL mismatch.\n  got:      ${download}\n  expected: ${expectedDownload}`);
}

const manifest = String(sys.manifest || '');
if (!manifest.includes('raw.githubusercontent.com/Destroyed-Faith/masterySystem')) {
  fail(`system.json manifest URL unexpected: ${manifest}`);
}

console.log(`validate-release-version: OK — ${pkgVer}`);
console.log(`  tag:      v${pkgVer}`);
console.log(`  zip:      ${expectedZipName}`);
console.log(`  download: ${expectedDownload}`);
