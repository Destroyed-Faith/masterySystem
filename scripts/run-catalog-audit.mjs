#!/usr/bin/env node
/**
 * Run Rules ↔ Foundry catalog audit and write docs/catalog-audit.json.
 *
 * Prefers compiled dist/; falls back to tsx for TypeScript sources.
 *
 * Usage: node scripts/run-catalog-audit.mjs
 *    or: npm run audit:catalog
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distModule = join(root, 'dist', 'utils', 'catalog-rules-audit.js');
const srcModule = join(root, 'src', 'utils', 'catalog-rules-audit.ts');
const outPath = join(root, 'docs', 'catalog-audit.json');

async function runFromDist() {
  const mod = await import(pathToFileURL(distModule).href);
  const report = mod.runAndWriteCatalogAudit({ rootDir: root, outPath });
  return report;
}

function runViaTsx() {
  const code = `
import { runAndWriteCatalogAudit } from ${JSON.stringify(pathToFileURL(srcModule).href)};
const report = runAndWriteCatalogAudit({ rootDir: ${JSON.stringify(root)}, outPath: ${JSON.stringify(outPath)} });
const s = report.summary;
console.log(JSON.stringify({ version: report.version, summary: s, entryCount: report.entries.length, outPath: ${JSON.stringify(outPath)} }, null, 2));
`;
  const result = spawnSync('npx', ['--yes', 'tsx', '-e', code], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || 'tsx audit failed');
    process.exit(result.status ?? 1);
  }
  if (result.stdout) process.stdout.write(result.stdout);
  return null;
}

function printSummary(report) {
  const s = report.summary;
  console.log(
    JSON.stringify(
      {
        version: report.version,
        summary: s,
        entryCount: report.entries.length,
        outPath,
      },
      null,
      2,
    ),
  );
}

const preferTsx = process.argv.includes('--tsx') || !existsSync(distModule);

try {
  if (!preferTsx) {
    try {
      const report = await runFromDist();
      printSummary(report);
      process.exit(0);
    } catch (err) {
      console.warn('dist import failed, falling back to tsx:', err?.message ?? err);
    }
  }
  runViaTsx();
} catch (err) {
  console.error(err);
  process.exit(1);
}
