/**
 * Catalogue v0.9.9.6 — every printed PL 1–16 row of the Active Buff, Reaction,
 * Movement and Passive catalogues (and the non-numeric Active tables) must be
 * reflected by the runtime template row: each number printed in the row's
 * cells (Level column excluded) has to appear in the runtime row.
 *
 * Structured Actives fields (dice, Specials, range, radius, attacks, Bars, HP)
 * are compared exactly in actives-v0996-parity.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_POWER_TEMPLATES, getTemplate } from '../src/utils/powers/templates/index';
import { _resetCatalogCache, filterCatalog } from '../src/utils/power-catalog';

const ROOT = join(__dirname, '..');

type CatalogueRow = Record<string, string>;
type CatalogueTable = { id: string; title: string; rows: Record<number, CatalogueRow> };

const clean = (s: string) => String(s ?? '').replace(/\*\*/g, '').replace(/<[^>]+>/g, '').trim();
const numbers = (s: string) => clean(s).match(/\d+(?:\.\d+)?/g) ?? [];
const WORD_NUMBERS: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5' };
const runtimeNumbers = (s: string) => [
  ...numbers(s),
  ...(s.toLowerCase().match(/\b(one|two|three|four|five)\b/g) ?? []).map((w) => WORD_NUMBERS[w]),
];

function parseCatalogue(file: string): CatalogueTable[] {
  const md = readFileSync(join(ROOT, 'docs/Rules/Canonical', file), 'utf8');
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: CatalogueTable[] = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^<h3 id="([^"]+)">\s*(.*)$/);
    if (!h) continue;
    let title = h[2].replace(/<span[\s\S]*$/, '').trim();
    if (!title) title = (lines[i + 1] ?? '').replace(/<span[\s\S]*$/, '').trim();
    let j = i + 1;
    while (j < lines.length && !/^\|\s*\*\*Level\*\*/.test(lines[j]) && !/^<h3 id=/.test(lines[j])) j++;
    const rows: Record<number, CatalogueRow> = {};
    if (j < lines.length && !/^<h3 id=/.test(lines[j])) {
      const header = lines[j].split('|').slice(1, -1).map((c) => clean(c).toLowerCase());
      for (let k = j + 2; k < lines.length && lines[k].startsWith('|'); k++) {
        const cells = lines[k].split('|').slice(1, -1);
        const lvl = Number(clean(cells[0]));
        if (!(lvl >= 1 && lvl <= 16)) continue;
        const row: CatalogueRow = {};
        header.forEach((name, idx) => (row[name] = cells[idx] ?? ''));
        rows[lvl] = row;
      }
    }
    out.push({ id: h[1], title: clean(title), rows });
  }
  return out;
}

/** Printed technical name → runtime template name, where the runtime label differs. */
const RUNTIME_NAME: Record<string, string> = {
  'Reaction: Damage': 'Reaction: Counter Damage',
  'Reaction: Damage + Push': 'Reaction: Counter Damage + Push',
  'Reaction: Initiative': 'Reaction: Initiative Gain',
};

/** Non-numeric Active tables (structured fields are covered by the Actives parity test). */
const ACTIVE_TEXT_TABLES: Record<string, string> = {
  'melee-push-pull': 'active-melee-control-push-pull',
  'ranged-push-pull': 'active-ranged-control-push-pull',
  'mind-illusion': 'active-mind-illusion',
  'mind-probe': 'active-mind-probe',
  'mental-control': 'active-mental-control',
  'ranged-power-image': 'active-ranged-illusion-image',
  'ranged-barrier': 'active-ranged-barrier',
};

function templateByName(title: string): any {
  const name = (RUNTIME_NAME[title] ?? title).toLowerCase();
  return (ALL_POWER_TEMPLATES as any[]).find((t) => String(t.name).toLowerCase() === name);
}

function rowDiffs(table: CatalogueTable, tpl: any): string[] {
  const diffs: string[] = [];
  for (const [lvl, row] of Object.entries(table.rows)) {
    if (/^unavailable$/i.test(clean(row.type ?? ''))) continue;
    const printed = numbers(Object.entries(row).filter(([k]) => k !== 'level').map(([, v]) => v).join(' ; '));
    const runtime = tpl?.levels?.[lvl];
    const pool = new Set(runtimeNumbers(JSON.stringify(runtime ?? {}).replace(/\\n/g, ' ')));
    const missing = printed.filter((n) => !pool.has(n));
    if (missing.length) {
      diffs.push(`${table.title} PL${lvl}: printed ${missing.join(', ')} not in runtime "${clean(runtime?.effect?.text ?? '').slice(0, 100)}"`);
    }
  }
  return diffs;
}

describe.each([
  ['ActiveBuffs.md', 36],
  ['Reactions.md', 16],
  ['Movement.md', 10],
  ['Passives.md', 28],
])('Catalogue v0.9.9.6 parity — %s', (file, count) => {
  const tables = parseCatalogue(file);

  it(`parses ${count} printed Powers`, () => {
    expect(tables).toHaveLength(count);
  });

  for (const table of tables) {
    it(`${table.title} PL 1–16`, () => {
      const tpl = templateByName(table.title);
      expect(tpl, `no runtime template for ${table.title}`).toBeTruthy();
      expect(rowDiffs(table, tpl).join('\n')).toBe('');
    });
  }
});

describe('Catalogue v0.9.9.6 parity — Actives.md text tables', () => {
  const tables = parseCatalogue('Actives.md');
  for (const [id, templateId] of Object.entries(ACTIVE_TEXT_TABLES)) {
    it(`${id} ↔ ${templateId}`, () => {
      const table = tables.find((t) => t.id === id);
      expect(table, `missing printed table ${id}`).toBeTruthy();
      expect(rowDiffs(table!, getTemplate(templateId)).join('\n')).toBe('');
    });
  }
});

describe('Catalogue v0.9.9.6 parity — builder offers only printed Reactions', () => {
  it('the Reaction picker lists exactly the 16 printed Reaction Effects', () => {
    _resetCatalogCache();
    const offered = filterCatalog({ category: 'reaction' }).map((e) => e.templateId).sort();
    const printed = parseCatalogue('Reactions.md').map((t) => templateByName(t.title)?.templateId).sort();
    expect(printed).not.toContain(undefined);
    expect(offered).toEqual(printed);
  });

  it('unprinted Reaction templates still resolve by templateId for owned items', () => {
    expect(filterCatalog({ category: 'reaction', templateId: 'reaction-reactive-overload' })).toHaveLength(1);
    expect(filterCatalog({ category: 'reaction', includeNonFinalReactions: true }).length).toBeGreaterThan(16);
  });
});
