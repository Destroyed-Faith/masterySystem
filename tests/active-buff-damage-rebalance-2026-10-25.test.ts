/**
 * Active Buff: Damage rebalance (2026-10-25).
 * +1d8 per Power Level (30 PP / +1d8). PL4=+4d8, PL10=+10d8, PL16=+16d8.
 * Artifact grants (Red Hunt, Red Potion) use the same canonical template.
 * Damage Aura / Allied / Summon Damage Aura unchanged.
 */
import { describe, expect, it } from 'vitest';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { resolvePowerMechanics, collectMechanicsContributions } from '../src/utils/power-mechanics.js';

const EXPECTED_DAMAGE = [
  '1d8', '2d8', '3d8', '4d8', '5d8', '6d8', '7d8', '8d8',
  '9d8', '10d8', '11d8', '12d8', '13d8', '14d8', '15d8', '16d8',
] as const;

describe('Active Buff: Damage — 2026-10-25 rebalance', () => {
  const tpl = getTemplate('ab-damage');

  it('exists as ab-damage', () => {
    expect(tpl?.templateId).toBe('ab-damage');
    expect(tpl?.name).toMatch(/Active Buff: Damage/);
  });

  it('grants +Nd8 at every Power Level 1–16', () => {
    for (let pl = 1; pl <= 16; pl++) {
      const row = tpl?.levels?.[String(pl)];
      expect(row, `missing PL ${pl}`).toBeTruthy();
      const flat = String(row?.mechanics?.damageRider?.flat || '');
      const text = String(row?.effect?.text || '');
      expect(flat).toBe(`+${EXPECTED_DAMAGE[pl - 1]}`);
      expect(text).toMatch(new RegExp(`\\+${EXPECTED_DAMAGE[pl - 1]}`));
    }
  });

  it('anchors PL4 / PL10 / PL16 at +4d8 / +10d8 / +16d8', () => {
    expect(tpl?.levels?.['4']?.mechanics?.damageRider?.flat).toBe('+4d8');
    expect(tpl?.levels?.['10']?.mechanics?.damageRider?.flat).toBe('+10d8');
    expect(tpl?.levels?.['16']?.mechanics?.damageRider?.flat).toBe('+16d8');
  });

  it('does not keep the obsolete +3d8…+33d8 / +5 PP overspend curve', () => {
    expect(tpl?.levels?.['1']?.mechanics?.damageRider?.flat).not.toBe('+3d8');
    expect(tpl?.levels?.['4']?.mechanics?.damageRider?.flat).not.toBe('+9d8');
    expect(tpl?.levels?.['16']?.mechanics?.damageRider?.flat).not.toBe('+33d8');
  });
});

describe('Damage Aura families unchanged', () => {
  it('ab-damage-aura / allied / summon keep prior dice (not the Damage Buff curve)', () => {
    const aura = getTemplate('ab-damage-aura');
    const allied = getTemplate('ab-allied-damage-aura');
    const summon = getTemplate('ab-summon-damage-aura');
    // Self Damage Aura L4 is still its own table (not +4d8 from Damage Buff).
    expect(String(aura?.levels?.['4']?.mechanics?.damageRider?.flat || aura?.levels?.['4']?.effect?.dice || '')).not.toBe(
      '+4d8',
    );
    expect(aura?.templateId).toBe('ab-damage-aura');
    expect(allied?.templateId).toBe('ab-allied-damage-aura');
    expect(summon?.templateId).toBe('ab-summon-damage-aura');
  });
});

describe('Artifact grants use canonical ab-damage', () => {
  it('Predator Crown Red Hunt maps to ab-damage', () => {
    const def = ECHO_ARTIFACTS.predatorCrownMight;
    const picks = buildEchoProgressionPicks(def);
    const red = picks.find((p) => /red\s*hunt/i.test(String(p.displayName || '')));
    expect(red?.powerTemplateId).toBe('ab-damage');
  });

  it('Alchemist Coat Red Potion maps to ab-damage', () => {
    const def = ECHO_ARTIFACTS.alchemistCoat;
    const picks = buildEchoProgressionPicks(def);
    const red = picks.find((p) => /red\s*potion/i.test(String(p.displayName || '')));
    expect(red?.powerTemplateId).toBe('ab-damage');
  });

  it('Red Hunt / Red Potion compiled rows use +4d8 / +10d8 / +16d8 from ab-damage', () => {
    const expectedByStage = ['+4d8', '+10d8', '+16d8'];
    for (const key of ['predatorCrownMight', 'alchemistCoat'] as const) {
      const def = ECHO_ARTIFACTS[key];
      const picks = buildEchoProgressionPicks(def);
      const table = resolveFullLevelProgression(def.levelProgression, picks as any);
      const rows = table
        .filter((r) => /Red (Hunt|Potion)/i.test(String(r.name || '')))
        .sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
      expect(rows.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(rows[i].powerTemplateId).toBe('ab-damage');
        expect(String(rows[i].effect || '')).toMatch(
          new RegExp(expectedByStage[i].replace('+', '\\+')),
        );
      }
    }
  });

  it('artifact ActiveEffect with powerTemplateId ab-damage contributes +4d8 from catalog', () => {
    const actor = {
      items: [],
      effects: [
        {
          name: 'Red Hunt I',
          flags: {
            'mastery-system': {
              activeBuff: true,
              artifactActiveBuff: true,
              powerTemplateId: 'ab-damage',
              effectiveLevel: 4,
              powerName: 'Red Hunt I',
            },
          },
          getFlag(ns: string, key: string) {
            if (ns !== 'mastery-system') return undefined;
            return (this.flags as any)?.['mastery-system']?.[key];
          },
        },
      ],
    };
    const contribs = collectMechanicsContributions(actor as any);
    const buff = contribs.find((c) => /Red Hunt/i.test(String(c.powerName || c.source || '')));
    expect(buff).toBeTruthy();
    expect(String((buff?.mechanics as any)?.damageRider?.flat || '')).toBe('+4d8');
  });
});

describe('Active Buff: Damage in Breath damage pipeline', () => {
  it('PL4 rider is +4d8 and stacks on Damage Breath shared pool for Scurry L3', () => {
    const tpl = getTemplate('ab-damage');
    expect(tpl?.levels?.['4']?.mechanics?.damageRider?.flat).toBe('+4d8');
    // Combat damage-dialog rolls unconditional damageRider from activeBuff-active
    // contributions (see calculateDamage activeBuffDamageRolled). Scurry L3:
    // Bite 3d8 + Power 4d8 + Buff 4d8 = 11d8 eligible dice.
    const fromBuff = resolvePowerMechanics({
      name: 'Active Buff: Damage',
      type: 'power',
      system: { templateId: 'ab-damage', rank: 4, level: 4, levels: {} },
    } as any);
    expect(String((fromBuff as any)?.damageRider?.flat || '')).toBe('+4d8');
  });
});

describe("Scurry's existing PL4 Damage Buff", () => {
  it('resolves +4d8 from ab-damage at rank 4 (not legacy +9d8)', () => {
    // Live template is authoritative for new activations / resync.
    const live = getTemplate('ab-damage')?.levels?.['4'];
    expect(live?.mechanics?.damageRider?.flat).toBe('+4d8');

    // When resolving from templateId + rank (empty/legacy levels overridden by catalog):
    const fromCatalog = resolvePowerMechanics({
      name: 'Active Buff: Damage',
      type: 'power',
      system: {
        templateId: 'ab-damage',
        rank: 4,
        level: 4,
        powerType: 'active-buff',
        levels: {},
      },
    } as any);
    expect(String((fromCatalog as any)?.damageRider?.flat || '')).toBe('+4d8');

    // Legacy baked +9d8 on the item must still yield catalog +4d8 via templateId.
    const fromLegacyBake = resolvePowerMechanics({
      name: 'Active Buff: Damage',
      type: 'power',
      system: {
        templateId: 'ab-damage',
        rank: 4,
        level: 4,
        powerType: 'active-buff',
        levels: {
          '4': {
            effect: { text: 'Your attacks gain +9d8 damage.', dice: '+9d8' },
            mechanics: { damageRider: { flat: '+9d8' }, duration: 'masteryRankRounds' },
          },
        },
      },
    } as any);
    expect(String((fromLegacyBake as any)?.damageRider?.flat || '')).toBe('+4d8');
  });
});
