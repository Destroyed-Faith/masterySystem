/**
 * Batch 9C.1 — Oracle Field → Active Buff: Armor (no legacy aura).
 */
import { describe, expect, it } from 'vitest';
import {
  buildEchoProgressionPicks,
  getEchoArtifact,
} from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { artifactLevelToTemplateRank } from '../src/utils/artifact-spell-pick.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';

function fullRows() {
  const def = getEchoArtifact('oracleFrame')!;
  return resolveFullLevelProgression(def.levelProgression, buildEchoProgressionPicks(def) as any);
}

function rowAt(level: number) {
  return fullRows().find((r) => Number(r.level) === level)!;
}

function activatedOracleAt(level: number) {
  const tree = buildEchoArtifactTree(getEchoArtifact('oracleFrame')!);
  const node = tree.nodes[level - 1];
  const flags = node.itemData.flags?.['mastery-system'] || {};
  return {
    id: `oracle-l${level}`,
    type: 'artifact',
    name: node.itemData.name,
    system: { ...(node.itemData.system as any), equipped: true, binding: 'echo' },
    getFlag: (_ns: string, key: string) => (key === 'artifactActivated' ? true : flags[key]),
  };
}

describe('Batch 9C.1 — Oracle Field Active Buff Armor', () => {
  it('L1/4/7 grant Active Buff Armor PL 4/10/16 with +8/+20/+32', () => {
    const stages = [
      { L: 1, name: 'Oracle Field I', pl: 4, armor: 8 },
      { L: 4, name: 'Oracle Field II', pl: 10, armor: 20 },
      { L: 7, name: 'Oracle Field III', pl: 16, armor: 32 },
    ];
    const tpl = getTemplate('ab-armor')!;
    for (const s of stages) {
      const row = rowAt(s.L);
      expect(row.name).toBe(s.name);
      expect(row.powerTemplateId).toBe('ab-armor');
      expect(row.type).toMatch(/Active Buff/i);
      expect(row.effect).toMatch(new RegExp(`\\+${s.armor} Armor`));
      expect(String(row.aoe || '')).not.toMatch(/radius/i);
      expect(row.effect).not.toMatch(/allies/i);
      expect(Number(artifactLevelToTemplateRank(s.L))).toBe(s.pl);
      const levelRow = tpl.levels![String(s.pl)] as any;
      expect(String(levelRow.effect?.text || '')).toMatch(new RegExp(`\\+${s.armor} Armor`));
      expect(String(levelRow.range || levelRow.target || 'Self')).not.toMatch(/ally/i);
      const durationBlob = JSON.stringify(levelRow.duration ?? levelRow.mechanics?.duration ?? '');
      expect(durationBlob).toMatch(/Mastery Rank|masteryRank/i);
    }
    expect(rowAt(4).effect).toMatch(/replaces Oracle Field I/i);
    expect(rowAt(7).effect).toMatch(/replaces Oracle Field II/i);
  });

  it('never grants ab-armor-aura; catalogue Armor is Self-only', () => {
    expect(fullRows().every((r) => r.powerTemplateId !== 'ab-armor-aura')).toBe(true);
    expect(buildEchoProgressionPicks(getEchoArtifact('oracleFrame')!).find((p: any) => p.level === 1)?.powerTemplateId).toBe(
      'ab-armor',
    );
    const tpl = getTemplate('ab-armor')!;
    const fluff = `${tpl.fluff || ''} ${JSON.stringify(tpl.levels?.['4'] || {})}`;
    expect(fluff).not.toMatch(/allies in the area|Radius/i);
  });

  it('tree resync exposes Oracle Field III as ab-armor at L7', () => {
    const tree = buildEchoArtifactTree(getEchoArtifact('oracleFrame')!);
    const sys = tree.nodes[6].itemData.system as any;
    const field = sys.levelProgression.find((r: any) => /Oracle Field/i.test(String(r.name)));
    expect(field?.name).toBe('Oracle Field III');
    expect(field?.powerTemplateId).toBe('ab-armor');
    expect(field?.effect).toMatch(/\+32 Armor/);
    expect(String(field?.aoe || '')).not.toMatch(/radius/i);
  });

  it('radial Active Buff option uses ab-armor (single-buff lifecycle path)', () => {
    const item = activatedOracleAt(1);
    const opts = buildArtifactRadialOptions({ id: 'a1', items: [item] } as any);
    const field = opts.find((o) => /Oracle Field/i.test(String(o.name)));
    expect(field).toBeTruthy();
    expect(field?.powerType).toBe('active-buff');
    expect(field?.artifactPowerTemplateId).toBe('ab-armor');
    expect(opts.filter((o) => o.artifactPowerTemplateId === 'ab-armor-aura')).toHaveLength(0);
  });
});
