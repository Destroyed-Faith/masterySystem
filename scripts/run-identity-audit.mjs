#!/usr/bin/env node
/**
 * Identity preflight audit (Batch B). Read-only.
 * Usage: node scripts/run-identity-audit.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Prefer compiled/ts via vitest-style: dynamic import of ts through tsx if available,
// otherwise load from a lightweight inline evaluation by spawning vitest.
// This script is intended to be run via: npm run audit:identity

async function main() {
  let preflight;
  try {
    // When running under vitest/tsx the .ts modules resolve; for plain node use dynamic import of dist if present.
    const mod = await import(pathToFileURL(path.join(root, 'src/utils/identity-preflight.ts')).href);
    preflight = mod;
  } catch (err) {
    console.error('[audit:identity] Failed to load identity-preflight.ts directly.');
    console.error('Run via: npx vitest run tests/identity-preflight.test.ts  (or use tsx)');
    console.error(String(err));
    process.exit(1);
  }

  const report = preflight.runIdentityPreflight({ kind: 'catalog' });
  const blocking = report.entries.filter(
    (e) => e.severity === 'blocks-activation' || e.severity === 'omits-contribution',
  );

  console.log(JSON.stringify({
    generatedAt: report.generatedAt,
    scope: report.scope,
    totals: report.totals,
    blockingCount: blocking.length,
    blocking: blocking.slice(0, 50).map((e) => ({
      reason: e.reason,
      diagnostic: e.diagnostic,
      ref: e.ref,
      disposition: e.disposition,
    })),
  }, null, 2));

  if (blocking.length > 0) {
    console.error(`[audit:identity] FAIL: ${blocking.length} blocking unresolved identities`);
    process.exit(1);
  }
  console.error('[audit:identity] PASS: 0 blocking unresolved identities on catalog');
  process.exit(0);
}

main();
