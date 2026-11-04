import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import { getGeneralArtifact } from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { computePerceptionTn } from '../src/combat/perception-gate.js';

const TABLES = JSON.parse(
  readFileSync(join(__dirname, '../scripts/_special-aura-tables.json'), 'utf8'),
) as Record<
  string,
  {
    name: string;
    rows: Array<
      | { pl: number; unavailable: true }
      | { pl: number; radiusM: number; special: string; rank: number }
    >;
  }
>;

function tpl(id: string) {
  return ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id)!;
}

function row(id: string, pl: number) {
  return tpl(id).levels![String(pl)] as any;
}

describe('Batch 9I — Special Aura ×1.0 tables', () => {
  it('loads all 14 aura tables with PL 1–16', () => {
    expect(Object.keys(TABLES).sort()).toEqual(
      [
        'blight',
        'challenge',
        'corrode',
        'disoriented',
        'expose',
        'hex',
        'lacerate',
        'mark',
        'root',
        'ruin',
        'slow',
        'soulburn',
        'sundered',
        'weaken',
      ].sort(),
    );
    for (const pack of Object.values(TABLES)) {
      expect(pack.rows).toHaveLength(16);
    }
  });

  it('matches printed ×1 tables in Active Buff templates (radius ≤ 3 m; Ruin = 2 m)', () => {
    for (const [specialKey, pack] of Object.entries(TABLES)) {
      const id = `ab-${specialKey}-aura`;
      expect(tpl(id), id).toBeTruthy();
      for (const expected of pack.rows) {
        const lvl = row(id, expected.pl);
        if ('unavailable' in expected && expected.unavailable) {
          expect(lvl.mechanics.specialAuraUnavailable, `${id} PL${expected.pl}`).toBe(true);
          continue;
        }
        const avail = expected as { pl: number; radiusM: number; special: string; rank: number };
        expect(lvl.mechanics.activeSpecialAura.rank).toBe(avail.rank);
        expect(lvl.mechanics.activeSpecialAura.radiusM).toBe(avail.radiusM);
        expect(avail.radiusM).toBeLessThanOrEqual(3);
        if (specialKey === 'ruin') expect(avail.radiusM).toBe(2);
      }
    }
  });

  it('Sundered Aura cross-checks Moonlight PL 4/10/16', () => {
    expect(row('ab-sundered-aura', 4).mechanics.activeSpecialAura).toMatchObject({
      rank: 4,
      radiusM: 2,
    });
    expect(row('ab-sundered-aura', 10).mechanics.activeSpecialAura).toMatchObject({
      rank: 7,
      radiusM: 3,
    });
    expect(row('ab-sundered-aura', 16).mechanics.activeSpecialAura).toMatchObject({
      rank: 10,
      radiusM: 3,
    });
  });

  it('Ruin Aura stays 2 m at PL 4/10/16 with printed ranks', () => {
    expect(row('ab-ruin-aura', 4).mechanics.activeSpecialAura).toMatchObject({
      rank: 5,
      radiusM: 2,
    });
    expect(row('ab-ruin-aura', 10).mechanics.activeSpecialAura).toMatchObject({
      rank: 10,
      radiusM: 2,
    });
    expect(row('ab-ruin-aura', 16).mechanics.activeSpecialAura).toMatchObject({
      rank: 13,
      radiusM: 2,
    });
  });
});

describe('Batch 9I — Moonlight Shadow → Sundered Aura', () => {
  it('Moonlight Greatsword L3/6/9 bind ab-sundered-aura at PL 4/10/16', () => {
    const def = getGeneralArtifact('moonlightGreatsword')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    expect(picks[2].powerTemplateId).toBe('ab-sundered-aura');
    expect(picks[2].displayName).toMatch(/Moonlight Shadow/);
    const texts = picks[2].stageEffectTexts as string[];
    expect(texts[0]).toMatch(/Sundered\(4\)/);
    expect(texts[1]).toMatch(/Sundered\(7\)/);
    expect(texts[2]).toMatch(/Sundered\(10\)/);
    expect(texts.join(' ')).toMatch(/No separate Safe Haven Rest use limit/i);
    expect(texts.join(' ')).not.toMatch(/\d+d8 damage/i);
  });
});

describe('Batch 9I — Frostwave / Draconic Roar unchanged', () => {
  it('Frostwave stays Melee AoE Slow PL 4/8/16', () => {
    const def = getGeneralArtifact('heartOfWinter')!;
    const picks = buildEchoProgressionPicks(def) as any[];
    const frost = picks.find((p) => /Frostwave/i.test(String(p.displayName || '')));
    expect(frost?.stagePowerLevels).toEqual(['4', '8', '16']);
    expect(frost?.chosenSpecial?.key).toBe('slow');
  });

  it('Draconic Roar remains Armor Aura +4/+10/+16 (not Special Aura formula)', async () => {
    const { ECHO_ARTIFACTS } = await import('../src/utils/echo-artifacts.js');
    const head = ECHO_ARTIFACTS.dragonHead;
    const roarPick = head.progressionPickSpecs?.[2] as any;
    expect(roarPick?.templateId).toBe('ab-armor-aura');
    expect(roarPick?.stagePowerLevels).toEqual(['4', '10', '16']);
    const lvl = (pl: string) => getTemplate('ab-armor-aura')?.levels?.[pl] as any;
    // Armor Aura grants +1 Armor per PL → PL4/10/16 = +4/+10/+16 (not ×1 Special Aura PP).
    expect(String(lvl('4')?.effect?.text || '')).toMatch(/\+4\s*Armor/i);
    expect(String(lvl('10')?.effect?.text || '')).toMatch(/\+10\s*Armor/i);
    expect(String(lvl('16')?.effect?.text || '')).toMatch(/\+16\s*Armor/i);
  });
});

describe('Batch 9I — Invisibility TN has no Stealth Points', () => {
  it('computePerceptionTn ignores stealthSpentThisRound when invisible', () => {
    const target: any = {
      id: 't1',
      system: {
        mastery: { rank: 3 },
        health: {
          currentBar: 0,
          bars: [
            { name: 'Healthy' },
            { name: 'Bruised' },
            { name: 'Injured' },
            { name: 'Wounded' },
            { name: 'Broken' },
            { name: 'Incapacitated' },
          ],
        },
      },
      items: [
        {
          type: 'power',
          system: {
            templateId: 'passive-invisibility',
            category: 'passive',
            rank: 6,
            levels: {
              '6': { mechanics: { invisibilityBonus: 6, blockedSpecialSenseSlots: 1 } },
            },
          },
        },
      ],
      getFlag: vi.fn(() => ({ stealthSpentThisRound: 99 })),
    };
    // MR3 + bonus 6 = 18; Stealth spend must not raise it.
    expect(computePerceptionTn(target)).toBe(18);
  });
});
