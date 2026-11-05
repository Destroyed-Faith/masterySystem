/**
 * K6b fail-closed guard: new mechanical text-matching sites fail the suite.
 * Allowlist entries require file + line + distinctive match substring
 * (tests/__fixtures__/identity-text-guard-allowlist.json).
 * Display/search sites may remain with reason starting with "display".
 * Identity modules are never allowlisted.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const ALLOWLIST_PATH = path.join(
  ROOT,
  'tests/__fixtures__/identity-text-guard-allowlist.json',
);

const SCOPES = [
  'src/combat',
  'src/radial-menu',
  'src/utils/power-mechanics.ts',
  'src/utils/artifact-active-buffs.ts',
  'src/utils/breath-weapon.ts',
  'src/utils/artifact-visible-abilities.ts',
];

/**
 * Mechanical text detection. Includes:
 * - name/description/label .includes/.match/.test
 * - known text-classifier helpers
 * - Limited/Breath/Moonlight regexes
 * - tags.includes (routing)
 * - regex tests on derived blobs / name-like locals (cleanse/heal/thorns/limited)
 */
const PATTERN =
  /\b(name|description|label)\b[^;\n]{0,80}\.(includes|match|test)\(|textSuggestsActiveBuff|isBreathWeaponName|inferRestoration|artifactRowLooksLikeHeal|canonicalPowerLookupName|classifyArtifactRowType|isUltimateProgressionRow|\/moonlight|\/undead|\/breath\\s\*weapon|power level\\s\*|\\blimited\\b|tags\.includes\(|\/\\b(?:cleanse|heal|thorns)\\b[^;\n]{0,100}\.test\(\s*(?:blob|name|optionName|n|tid|parseName|stripped|raw)\b/;

const SKIP_IDENTITY = new Set([
  'src/utils/power-identity.ts',
  'src/utils/artifact-functions.ts',
  'src/utils/identity-shadow.ts',
  'src/utils/identity-preflight.ts',
  'src/utils/artifact-row-identity.ts',
]);

interface AllowEntry {
  file: string;
  /** 1-based line; required for K6b — new hits on other lines must fail. */
  line: number;
  match: string;
  reason: string;
}

function norm(p: string): string {
  return p.replace(/\\/g, '/');
}

function collectTsFiles(rel: string): string[] {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const st = fs.statSync(abs);
  if (st.isFile()) return abs.endsWith('.ts') ? [abs] : [];
  const out: string[] = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.name.endsWith('.test.ts')) continue;
    const p = path.join(abs, ent.name);
    if (ent.isDirectory()) out.push(...collectTsFiles(path.relative(ROOT, p)));
    else if (ent.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

function isDefinitionOnly(line: string): boolean {
  const t = line.trim();
  // Skip helper declarations (call sites remain scanned).
  return /^(export\s+)?function\s+\w*(inferRestoration|artifactRowLooksLikeHeal|isBreathWeaponName|classifyArtifactRowType|isUltimateProgressionRow|textSuggestsActiveBuff|canonicalPowerLookupName)\w*\s*\(/.test(
    t,
  );
}

function scanHits(): Array<{ file: string; line: number; text: string }> {
  const hits: Array<{ file: string; line: number; text: string }> = [];
  for (const f of SCOPES.flatMap(collectTsFiles)) {
    const rel = norm(path.relative(ROOT, f));
    if (SKIP_IDENTITY.has(rel)) continue;
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!PATTERN.test(line)) return;
      if (isDefinitionOnly(line)) return;
      hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 160) });
    });
  }
  return hits;
}

function isAllowlisted(
  hit: { file: string; line: number; text: string },
  entries: AllowEntry[],
): boolean {
  return entries.some((e) => {
    if (norm(e.file) !== hit.file) return false;
    if (Number(e.line) !== hit.line) return false;
    if (!e.match || typeof e.match !== 'string') return false;
    return hit.text.includes(e.match);
  });
}

describe('no-text-mechanic-matching (fail-closed guard)', () => {
  it('identity modules contain no name/description includes matching', () => {
    const files = [
      'src/utils/power-identity.ts',
      'src/utils/artifact-functions.ts',
      'src/utils/identity-shadow.ts',
      'src/utils/artifact-row-identity.ts',
    ];
    const banned =
      /\.(name|description|label|effect|special|fluff)\b[^;\n]{0,80}\.(includes|match|test)\(/;
    for (const rel of files) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(banned.test(src), rel).toBe(false);
    }
  });

  it('fails on new mechanical text sites outside the allowlist', () => {
    const allow = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) as {
      entries: AllowEntry[];
    };
    // K6b: every entry must pin a line number (no broad file-wide matches).
    const missingLine = allow.entries.filter((e) => !Number.isFinite(e.line) || e.line < 1);
    expect(missingLine, JSON.stringify(missingLine.slice(0, 5))).toEqual([]);
    const broad = allow.entries.filter((e) =>
      ['name', 'heal', 'breath', 'limited'].includes(String(e.match || '').trim()),
    );
    expect(broad, 'broad match tokens must be gone').toEqual([]);

    const hits = scanHits();
    const unexpected = hits.filter((h) => !isAllowlisted(h, allow.entries));
    if (unexpected.length) {
      const msg = unexpected
        .slice(0, 40)
        .map((h) => `${h.file}:${h.line}: ${h.text}`)
        .join('\n');
      expect.fail(
        `${unexpected.length} new text-mechanic site(s) not on allowlist:\n${msg}\n` +
          `Add a justified {file,line,match,reason} entry to tests/__fixtures__/identity-text-guard-allowlist.json or remove the match.`,
      );
    }
    expect(hits.length).toBeGreaterThan(0);
  });

  it('combat modules must not import mapping tables (import guard)', () => {
    const bannedImport =
      /from\s+['"].*identity-migration-map|from\s+['"].*power-name-aliases|POWER_NAME_TO_TEMPLATE/;
    const combatFiles = collectTsFiles('src/combat');
    const offenders: string[] = [];
    for (const f of combatFiles) {
      const src = fs.readFileSync(f, 'utf8');
      if (bannedImport.test(src)) offenders.push(norm(path.relative(ROOT, f)));
    }
    expect(offenders).toEqual([]);
  });
});
