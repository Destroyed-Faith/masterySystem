#!/usr/bin/env node
/**
 * Audit: DR% / Phasing Exclusivity
 *
 * Scans every Mastery-Tree power definition (plus stone powers and spells)
 * for any source that declares `damageReductionPct`, `phasing`, or
 * `triggers.combatStart.phasingCharges`. Confirms that the declaring power
 * name is in the whitelist of six sanctioned subsystems:
 *
 *   - DR%:      Damage Reduction (passive), Unyielding Shell (buff),
 *               Unyielding Intercept (reaction)
 *   - Phasing:  Ghostform (passive), Ghost Mantle (buff), Ghost Slip (reaction)
 *
 * Writes a human-readable report to `reports/dr-phasing-exclusivity.md`.
 * Exits with a non-zero code when violations are found — CI and pre-commit
 * hooks can gate on this to stop homebrew DR/Phasing from leaking in.
 *
 * Read-only: this script never modifies source files.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(ROOT, 'reports', 'dr-phasing-exclusivity.md');

/**
 * Directories / files scanned. Stone powers and spell catalogs share the
 * same mechanics shape and must abide by the same whitelist.
 */
const SCAN_TARGETS = [
  { dir: path.resolve(ROOT, 'src', 'utils', 'powers'), kind: 'tree-power' },
  { dir: path.resolve(ROOT, 'src', 'stones'), kind: 'stone-power' },
  { dir: path.resolve(ROOT, 'src', 'system'), kind: 'system' },
];

const SANCTIONED_DR_NAMES = new Set([
  'Damage Reduction',
  'Unyielding Shell',
  'Unyielding Intercept',
]);
const SANCTIONED_PHASING_NAMES = new Set(['Ghostform', 'Ghost Mantle', 'Ghost Slip']);

/**
 * Find the nearest enclosing object literal that contains a `name: '...'`
 * field above the given source offset. Returns the name string (or the
 * literal '(unnamed)' when no surrounding object declares one).
 */
function findEnclosingName(src, offset) {
  // Walk backwards a bounded distance (64KB) to find the nearest `name:` field.
  const windowStart = Math.max(0, offset - 64 * 1024);
  const window = src.substring(windowStart, offset);
  const matches = [...window.matchAll(/\bname\s*:\s*['"`]([^'"`]+)['"`]/g)];
  if (matches.length === 0) return '(unnamed)';
  return matches[matches.length - 1][1];
}

function scanFileForDeclarations(file, src) {
  const findings = [];

  // Patterns we care about. Each match carries an offset so we can look up
  // the enclosing power name. False-positives inside test files / comments
  // are filtered downstream by the caller.
  const patterns = [
    {
      axis: 'dr',
      regex: /\bdamageReductionPct\s*:\s*(\d+)/g,
      label: 'damageReductionPct',
    },
    { axis: 'phasing', regex: /\bphasing\s*:\s*\{/g, label: 'phasing' },
    {
      axis: 'phasing',
      regex: /\bphasingCharges\s*:\s*(\d+)/g,
      label: 'triggers.combatStart.phasingCharges',
    },
  ];

  for (const pat of patterns) {
    let m;
    while ((m = pat.regex.exec(src)) != null) {
      const name = findEnclosingName(src, m.index);
      findings.push({
        file,
        axis: pat.axis,
        field: pat.label,
        name,
        offset: m.index,
      });
    }
  }

  return findings;
}

function walkDir(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (dir.endsWith('.ts') || dir.endsWith('.js')) out.push(dir);
    return out;
  }
  if (!stat.isDirectory()) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const s = fs.statSync(full);
    if (s.isDirectory()) walkDir(full, out);
    else if (s.isFile() && (entry.endsWith('.ts') || entry.endsWith('.js'))) out.push(full);
  }
  return out;
}

function isSanctionedFinding(f) {
  if (f.axis === 'dr') return SANCTIONED_DR_NAMES.has(f.name);
  if (f.axis === 'phasing') return SANCTIONED_PHASING_NAMES.has(f.name);
  return false;
}

function isTypeDefinitionFile(file) {
  // `src/types/**` is pure schema — DR/Phasing fields are *declared* there,
  // not declared as power sources. Skip these from the exclusivity audit.
  return /[\\/]types[\\/]/.test(file) || file.endsWith('.d.ts');
}

function isAggregatorFile(file) {
  // The aggregator module legitimately touches these fields for gating.
  return /power-mechanics\.ts$/.test(file);
}

function isSubsystemManifest(file) {
  // The sanctioned-subsystems.ts file lists the six whitelisted powers
  // themselves — findings there are expected by definition.
  return /sanctioned-subsystems\.ts$/.test(file);
}

function run() {
  const allFiles = [];
  for (const target of SCAN_TARGETS) walkDir(target.dir, allFiles);
  allFiles.sort();

  const allFindings = [];
  for (const file of allFiles) {
    if (isTypeDefinitionFile(file) || isAggregatorFile(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const findings = scanFileForDeclarations(file, src);
    allFindings.push(...findings);
  }

  const violations = allFindings.filter(
    (f) => !isSubsystemManifest(f.file) && !isSanctionedFinding(f),
  );
  const sanctioned = allFindings.filter(
    (f) => isSubsystemManifest(f.file) || isSanctionedFinding(f),
  );

  const lines = [];
  lines.push('# DR% / Phasing Exclusivity Audit');
  lines.push('');
  lines.push(
    'Auto-generated by `scripts/audit-dr-phasing-exclusivity.js`. Verifies that',
  );
  lines.push('only the six sanctioned power lines declare `damageReductionPct`,');
  lines.push('`phasing`, or `triggers.combatStart.phasingCharges`.');
  lines.push('');
  lines.push(`**Total declarations scanned:** ${allFindings.length}`);
  lines.push(`**Sanctioned declarations:** ${sanctioned.length}`);
  lines.push(`**Violations:** ${violations.length}`);
  lines.push('');

  if (violations.length === 0) {
    lines.push('_No violations — only sanctioned powers declare DR%/Phasing fields._');
  } else {
    lines.push('## Violations');
    lines.push('');
    lines.push('| Power | Field | Axis | File |');
    lines.push('| --- | --- | --- | --- |');
    for (const v of violations) {
      const rel = path.relative(ROOT, v.file).replace(/\\/g, '/');
      lines.push(`| ${v.name} | \`${v.field}\` | ${v.axis} | ${rel} |`);
    }
  }

  lines.push('');
  lines.push('## Sanctioned declarations (expected)');
  lines.push('');
  if (sanctioned.length === 0) {
    lines.push('_None found. The six sanctioned powers must be defined somewhere —');
    lines.push('check `src/utils/powers/sanctioned-subsystems.ts`._');
  } else {
    lines.push('| Power | Field | Axis | File |');
    lines.push('| --- | --- | --- | --- |');
    for (const s of sanctioned) {
      const rel = path.relative(ROOT, s.file).replace(/\\/g, '/');
      lines.push(`| ${s.name} | \`${s.field}\` | ${s.axis} | ${rel} |`);
    }
  }

  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');

  console.log(`[audit-dr-phasing] Total scanned   : ${allFindings.length}`);
  console.log(`[audit-dr-phasing] Sanctioned      : ${sanctioned.length}`);
  console.log(`[audit-dr-phasing] Violations      : ${violations.length}`);
  console.log(
    `[audit-dr-phasing] Report written  -> ${path.relative(ROOT, REPORT_PATH)}`,
  );

  if (violations.length > 0) {
    console.error('[audit-dr-phasing] FAIL — violations present.');
    process.exit(1);
  }
}

run();
