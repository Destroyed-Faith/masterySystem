/**
 * Actives v0.9.9.6 — runtime tables must equal the printed tables of the only
 * binding rulebook, docs/Rules/Canonical/Actives.md (PL 1–16).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — plain ESM build script without type declarations
import { parseCanonicalActives } from '../scripts/generate-canonical-actives.mjs';
import { CANONICAL_ACTIVES } from '../src/utils/powers/canonical-actives.generated';
import { getTemplate } from '../src/utils/powers/templates/index';
import { getEligibleSpecialsForTier } from '../src/utils/powers/templates/_specials';
import { bindPoolSpecialsOnRow } from '../src/utils/powers/pool-special-ranks';
import type { ActiveSpecialTier } from '../src/types/item';

const ROOT = join(__dirname, '..');
const MD = readFileSync(join(ROOT, 'docs/Rules/Canonical/Actives.md'), 'utf8');

const SPECIALS = [
  'blight', 'challenge', 'corrode', 'disoriented', 'expose', 'hex', 'lacerate',
  'mark', 'root', 'ruin', 'slow', 'soulburn', 'sundered', 'weaken',
] as const;

function tierOf(key: string): ActiveSpecialTier {
  for (const t of [3, 4, 5, 6] as ActiveSpecialTier[]) {
    if (getEligibleSpecialsForTier(t).includes(key)) return t;
  }
  throw new Error(`no tier for ${key}`);
}

type Mapping = { canon: string; templateId: string; special?: string; checkSpecial?: string };

function mappings(): Mapping[] {
  const out: Mapping[] = [];
  for (const flavour of ['melee', 'ranged'] as const) {
    for (const key of SPECIALS) {
      const t = tierOf(key);
      out.push({ canon: `${flavour}-single-target-special-${key}`, templateId: `active-${flavour}-instant-special-t${t}`, special: key });
      out.push({ canon: `${flavour}-aoe-special-${key}`, templateId: `active-${flavour}-aoe-damage-t${t}`, special: key });
    }
    out.push({ canon: `${flavour}-single-target-attack`, templateId: `active-${flavour}-weapon-single` });
    out.push({ canon: `${flavour}-aoe-attack`, templateId: `active-${flavour}-weapon-aoe` });
    out.push({ canon: `${flavour}-split-weapon-attack`, templateId: `active-${flavour}-weapon-split` });
    out.push({ canon: `limited-${flavour}-single-target-attack`, templateId: `active-${flavour}-limited-single` });
    out.push({ canon: `limited-${flavour}-aoe-attack`, templateId: `active-${flavour}-limited-aoe` });
    out.push({ canon: `${flavour}-single-target-damage-transfer`, templateId: `active-${flavour}-single-target-damage-transfer` });
    out.push({ canon: `${flavour}-single-target-cleanse`, templateId: `active-${flavour}-single-cleanse`, checkSpecial: 'cleanse' });
    out.push({ canon: `${flavour}-aoe-cleanse`, templateId: `active-${flavour}-aoe-cleanse`, checkSpecial: 'cleanse' });
    out.push({ canon: `${flavour}-single-target-restoration`, templateId: `active-${flavour}-health-level-heal` });
    out.push({ canon: `${flavour}-aoe-restoration`, templateId: `active-${flavour}-aoe-restoration` });
  }
  out.push({ canon: 'ranged-autofire-weapon-attack', templateId: 'active-ranged-weapon-autofire' });
  out.push({ canon: 'ranged-barrier', templateId: 'active-ranged-barrier' });
  out.push({ canon: 'melee-push-pull', templateId: 'active-melee-control-push-pull' });
  out.push({ canon: 'ranged-push-pull', templateId: 'active-ranged-control-push-pull' });
  out.push({ canon: 'mind-illusion', templateId: 'active-mind-illusion' });
  out.push({ canon: 'mind-probe', templateId: 'active-mind-probe' });
  out.push({ canon: 'mental-control', templateId: 'active-mental-control' });
  out.push({ canon: 'ranged-power-image', templateId: 'active-ranged-illusion-image' });
  const zones: Record<string, { tier: ActiveSpecialTier; keys: string[] }> = {
    'ranged-persistent-zone-blight': { tier: 3, keys: ['blight'] },
    'ranged-persistent-zone-standard-diminishing-special': { tier: 4, keys: ['lacerate', 'mark', 'ruin', 'slow'] },
    'ranged-persistent-zone-heavy-diminishing-special': { tier: 5, keys: ['challenge', 'corrode', 'hex', 'sundered'] },
    'ranged-persistent-zone-pool-reduction-special': { tier: 6, keys: ['disoriented', 'expose', 'soulburn', 'weaken'] },
  };
  for (const [canon, z] of Object.entries(zones)) {
    for (const key of z.keys) out.push({ canon, templateId: `active-ranged-zone-t${z.tier}`, special: key });
  }
  return out;
}

function runtimeRow(templateId: string, special: string | undefined, lvl: number): any {
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error(`missing template ${templateId}`);
  const row = (tpl.levels as any)[String(lvl)];
  return special ? bindPoolSpecialsOnRow(row, special, templateId, lvl) : row;
}

function compare(m: Mapping): string[] {
  const table = CANONICAL_ACTIVES[m.canon];
  if (!table) return [`${m.canon}: missing in canon`];
  const diffs: string[] = [];
  for (let lvl = 1; lvl <= 16; lvl++) {
    const c = table.rows[lvl - 1];
    const r = runtimeRow(m.templateId, m.special, lvl);
    const tag = `${m.canon} -> ${m.templateId}${m.special ? `::${m.special}` : ''} PL${lvl}`;
    if (!c) continue;
    const key = m.special ?? m.checkSpecial;
    if (key && c.specials?.[key] !== undefined) {
      const rank = (r?.specials ?? []).find((s: any) => s?.key === key)?.rank;
      if (rank !== c.specials[key]) diffs.push(`${tag}: ${key} ${rank} != ${c.specials[key]}`);
    }
    if (c.radiusM !== undefined) {
      const radius = r?.aoe?.radiusM;
      if (radius !== c.radiusM) diffs.push(`${tag}: radius ${radius} != ${c.radiusM}`);
    }
    if (c.rangeM !== undefined) {
      const range = r?.range?.m;
      if (range !== c.rangeM) diffs.push(`${tag}: range ${range} != ${c.rangeM}`);
    }
    if (c.dice !== undefined && !m.special) {
      const dice = Number(String(r?.effect?.dice ?? '').match(/(\d+)d8/)?.[1] ?? NaN);
      if (dice !== c.dice) diffs.push(`${tag}: dice ${dice} != ${c.dice}`);
    }
    if (c.attacks !== undefined && r?.aoe?.targets !== c.attacks) {
      diffs.push(`${tag}: attacks ${r?.aoe?.targets} != ${c.attacks}`);
    }
    if (c.bars !== undefined && r?.mechanics?.healthLevelRecovery !== c.bars) {
      diffs.push(`${tag}: bars ${r?.mechanics?.healthLevelRecovery} != ${c.bars}`);
    }
    if (c.hp !== undefined) {
      const hp = Number(String(r?.effect?.text ?? '').match(/(\d+)\s*HP\b/)?.[1] ?? NaN);
      if (hp !== c.hp) diffs.push(`${tag}: hp ${hp} != ${c.hp}`);
    }
  }
  return diffs;
}

describe('Actives v0.9.9.6 — canonical source', () => {
  it('generated table module matches docs/Rules/Canonical/Actives.md', () => {
    expect(parseCanonicalActives(MD)).toEqual(CANONICAL_ACTIVES);
  });

  it('no parallel rule copies exist outside docs/Rules/Canonical', () => {
    for (const name of ['actives', 'active-buffs', 'passives', 'reactions', 'movement', 'artefacts', 'players-guide']) {
      expect(existsSync(join(ROOT, 'docs/Rules', `${name}.md`))).toBe(false);
    }
  });

  it('control examples from the v0.9.9.6 tables', () => {
    const rank = (tid: string, key: string, lvl: number) =>
      (runtimeRow(tid, key, lvl).specials as any[]).find((s) => s.key === key)?.rank;
    expect(rank('active-melee-instant-special-t3', 'blight', 4)).toBe(8);
    expect(rank('active-melee-instant-special-t4', 'ruin', 4)).toBe(7);
    expect(rank('active-ranged-instant-special-t4', 'ruin', 4)).toBe(6);
    expect(rank('active-melee-instant-special-t5', 'sundered', 4)).toBe(5);
    expect(rank('active-melee-instant-special-t5', 'sundered', 16)).toBe(12);
    expect(rank('active-ranged-instant-special-t5', 'sundered', 16)).toBe(11);
  });
});

describe('Actives v0.9.9.6 — runtime parity PL 1–16', () => {
  it('every printed Active table is mapped to a runtime template', () => {
    const mapped = new Set(mappings().map((m) => m.canon));
    expect(Object.keys(CANONICAL_ACTIVES).filter((k) => !mapped.has(k))).toEqual([]);
  });
  for (const m of mappings()) {
    it(`${m.canon} ↔ ${m.templateId}${m.special ? `::${m.special}` : ''}`, () => {
      expect(compare(m).join('\n')).toBe('');
    });
  }
});
