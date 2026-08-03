#!/usr/bin/env node
/**
 * One-shot helper: convert obvious console.log / console.debug under src/
 * to log.debug, adding a logger import when needed.
 *
 * Skips:
 * - src/utils/logger.ts
 * - stone-powers-dialog specialized DEBUG_* helpers (left gated as-is)
 *
 * Run: node scripts/dev/gate-console-noise.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const srcRoot = join(root, 'src');

const SKIP_FILES = new Set([
  'utils/logger.ts',
  'stones/stone-powers-dialog.ts', // specialized CONFIG.masterySystemDebugStone* gates
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (name.endsWith('.ts')) out.push(abs);
  }
  return out;
}

function importPathFor(fileAbs) {
  const rel = relative(dirname(fileAbs), join(srcRoot, 'utils/logger.ts')).replace(/\\/g, '/');
  const normalized = rel.startsWith('.') ? rel : `./${rel}`;
  return normalized.replace(/\.ts$/, '.js');
}

function ensureLogImport(text, fileAbs) {
  if (/\bimport\s*\{[^}]*\blog\b[^}]*\}\s*from\s*['"][^'"]*logger\.js['"]/.test(text)) {
    return text;
  }

  // Expand an existing logger import to include log
  const existing = text.match(/\bimport\s*\{([^}]*)\}\s*from\s*(['"][^'"]*logger\.js['"])/);
  if (existing) {
    const names = existing[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.includes('log')) names.unshift('log');
    return text.replace(existing[0], `import { ${names.join(', ')} } from ${existing[2]}`);
  }

  const imp = `import { log } from '${importPathFor(fileAbs)}';\n`;
  const importBlock = text.match(/^(?:(?:\/\/.*|\/\*[\s\S]*?\*\/)\s*)*(?:import\s[\s\S]*?;\s*)*/);
  if (importBlock) {
    const idx = importBlock[0].length;
    return text.slice(0, idx) + imp + text.slice(idx);
  }
  return imp + text;
}

let changedFiles = 0;
let replacements = 0;

for (const abs of walk(srcRoot)) {
  const rel = relative(srcRoot, abs).replace(/\\/g, '/');
  if (SKIP_FILES.has(rel)) continue;
  let text = readFileSync(abs, 'utf8');
  if (!/\bconsole\.(log|debug)\s*\(/.test(text)) continue;

  const before = text;
  text = text.replace(/\bconsole\.(log|debug)\s*\(/g, () => {
    replacements += 1;
    return 'log.debug(';
  });

  if (text === before) continue;
  text = ensureLogImport(text, abs);

  writeFileSync(abs, text);
  changedFiles += 1;
}

console.log(`gate-console-noise: ${replacements} calls in ${changedFiles} files`);
