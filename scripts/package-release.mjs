#!/usr/bin/env node
/**
 * Build a clean Foundry system ZIP from an allowlist of runtime files.
 *
 * Prerequisites: `npm run build` already succeeded (dist/ present).
 *
 * Usage:
 *   node scripts/package-release.mjs [--out dist-release]
 */

import {
  cpSync,
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  createWriteStream,
} from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function fail(msg) {
  console.error(`package-release: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  let outDir = join(root, 'dist-release');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outDir = join(root, argv[++i]);
  }
  return { outDir };
}

function readJson(abs) {
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function listFilesRecursive(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) out.push(...listFilesRecursive(abs));
    else out.push(abs);
  }
  return out;
}

function copyFiltered(srcRel, destRoot, filterFn) {
  const srcAbs = join(root, srcRel);
  if (!existsSync(srcAbs)) fail(`Missing required path: ${srcRel}`);
  const st = statSync(srcAbs);
  if (st.isFile()) {
    const dest = join(destRoot, srcRel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(srcAbs, dest);
    return;
  }
  for (const file of listFilesRecursive(srcAbs)) {
    const rel = relative(root, file);
    if (filterFn && !filterFn(rel, file)) continue;
    const dest = join(destRoot, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(file, dest);
  }
}

const { outDir } = parseArgs(process.argv.slice(2));
const sys = readJson(join(root, 'system.json'));
const version = String(sys.version || '');
if (!version) fail('system.json missing version');

const stage = join(outDir, 'stage');
const zipName = `mastery-system-${version}.zip`;
const zipPath = join(outDir, zipName);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

// Allowlist — verified against system.json + runtime path usage.
const ROOT_FILES = [
  'system.json',
  'template.json',
  'LICENSE.md',
  'MEDIA-AND-COMMUNITY-POLICY.md',
  'ASSET-LICENSE.md',
  'THIRD-PARTY-NOTICES.md',
  'README.md',
  'CHANGELOG.md',
];

for (const f of ROOT_FILES) {
  if (!existsSync(join(root, f))) fail(`Required file missing: ${f}`);
  cpSync(join(root, f), join(stage, f));
}

copyFiltered('dist', stage, (rel) => {
  // Runtime JS only — no source maps / declarations in player ZIP.
  return rel.startsWith('dist/') && extname(rel) === '.js';
});

copyFiltered('templates', stage);
copyFiltered('styles', stage);
copyFiltered('assets', stage);
copyFiltered('lang', stage);

if (existsSync(join(root, 'packs'))) {
  copyFiltered('packs', stage, (rel) => {
    // Skip LevelDB junk logs if any; keep pack data.
    const base = rel.split(/[/\\]/).pop() || '';
    return !base.endsWith('.log') && base !== 'LOG';
  });
}

// Verify system.json paths exist in staging.
const stagedSys = readJson(join(stage, 'system.json'));
const required = new Set();
required.add(stagedSys.template || 'template.json');
required.add(stagedSys.license || 'LICENSE');
required.add(stagedSys.readme || 'README.md');
required.add(stagedSys.changelog || 'CHANGELOG.md');
if (stagedSys.logo) required.add(stagedSys.logo);
if (stagedSys.banner) required.add(stagedSys.banner);
for (const esm of stagedSys.esmodules || []) required.add(esm);
for (const style of stagedSys.styles || []) required.add(style);
for (const lang of stagedSys.languages || []) if (lang.path) required.add(lang.path);
for (const pack of stagedSys.packs || []) if (pack.path) required.add(pack.path);
for (const media of stagedSys.media || []) {
  if (media.url) required.add(media.url);
  if (media.thumbnail) required.add(media.thumbnail);
}

const missing = [...required].filter((p) => !existsSync(join(stage, p)));
if (missing.length) {
  fail(`Staging missing system.json paths:\n  - ${missing.join('\n  - ')}`);
}

// Forbidden development paths must not appear.
const forbiddenPrefixes = [
  'src/',
  'tests/',
  'e2e/',
  'tools/',
  'scripts/',
  'reports/',
  '.github/',
  'node_modules/',
  'Rules/',
  'docs/',
];
const stagedFiles = listFilesRecursive(stage).map((f) => relative(stage, f).replace(/\\/g, '/'));
for (const rel of stagedFiles) {
  if (forbiddenPrefixes.some((p) => rel === p.slice(0, -1) || rel.startsWith(p))) {
    fail(`Forbidden path leaked into staging: ${rel}`);
  }
  if (rel.endsWith('.map') || rel.endsWith('.d.ts')) {
    fail(`Dev artifact in staging: ${rel}`);
  }
}

// ZIP with system.json at archive root (no wrapper folder).
mkdirSync(outDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);
try {
  execSync(`cd "${stage}" && zip -r -q "${zipPath}" .`, { stdio: 'inherit' });
} catch {
  fail('zip command failed — ensure `zip` is installed');
}

// Verify ZIP root contains system.json
const listing = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' });
if (!/^.*\s system\.json$/m.test(listing) && !listing.includes(' system.json\n') && !listing.includes(' system.json\r')) {
  // unzip -l formats with leading spaces before filename at end of line
  if (!listing.split('\n').some((line) => line.trimEnd().endsWith('system.json') && !line.includes('/system.json'))) {
    fail('ZIP does not contain system.json at archive root');
  }
}
if (listing.includes('stage/system.json')) {
  fail('ZIP incorrectly nests files under stage/');
}

writeFileSync(
  join(outDir, 'STAGING-MANIFEST.txt'),
  stagedFiles.sort().join('\n') + '\n',
);

console.log(`package-release: wrote ${zipPath}`);
console.log(`package-release: ${stagedFiles.length} files staged`);
