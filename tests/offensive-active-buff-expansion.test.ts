/**
 * Offensive Active Buff expansion 2026-10-24 — catalogue + runtime helpers.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FINAL_ACTIVE_BUFF_TEMPLATE_IDS, filterCatalog } from '../src/utils/power-catalog.js';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import {
  getActiveBuffAreaExpansionMeters,
  getActiveBuffArmorReduction,
  getActiveBuffEnemyEvadeReduction,
  getActiveBuffMaximizationUses,
  getActiveBuffSpellResistancePiercing,
  getEffectiveCircularAoeRadiusBonusMeters,
} from '../src/combat/offensive-active-buff-effects.js';
import { getTargetEvade, getCasterSpellPenetration } from '../src/combat/target-defenses.js';

const ROOT = join(__dirname, '..');
const JSON_PATH = join(
  ROOT,
  'docs/Rules/Destroyed_Faith_Offensive_Active_Buff_Progressions_2026-10-24.json',
);

const NEW_IDS = [
  'ab-armor-reduction',
  'ab-enemy-evade-reduction',
  'ab-spell-resistance-piercing',
  'ab-maximization',
  'ab-armor-reduction-aura',
  'ab-allied-damage-aura',
  'ab-area-expansion',
] as const;

const ORIGINAL_18 = [
  'ab-armor',
  'ab-evade',
  'ab-armor-aura',
  'ab-temp-hp',
  'ab-damage-reduction',
  'ab-phasing',
  'ab-spell-resistance',
  'ab-cleanse-maintenance',
  'ab-invisibility',
  'ab-reinforced-parry',
  'ab-reinforced-damage-negation',
  'ab-damage',
  'ab-critical',
  'ab-damage-aura',
  'ab-summon-damage-aura',
  'ab-thorns',
  'ab-summon-armor-aura',
  'ab-intensified-absorption',
] as const;

function mockBuffActor(mechanics: Record<string, unknown>) {
  return {
    id: 'Actor.buff',
    type: 'character',
    effects: [
      {
        disabled: false,
        flags: { 'mastery-system': { activeBuff: true, mechanics } },
      },
    ],
    getFlag: () => null,
    system: { combat: { evadeTotal: 10, spellResistanceTotal: 8 }, derived: {} },
  };
}

describe('Offensive Active Buff expansion 2026-10-24', () => {
  it('keeps original 18 IDs and adds exactly seven new ones (25 total)', () => {
    expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toHaveLength(25);
    for (const id of ORIGINAL_18) expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toContain(id);
    for (const id of NEW_IDS) expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toContain(id);
    expect(new Set(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).size).toBe(25);
  });

  it('preserves original Armor PL curve unchanged', () => {
    const armor = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-armor')!;
    expect(armor.levels['1']!.mechanics?.armor).toBe(2);
    expect(armor.levels['4']!.mechanics?.armor).toBe(8);
    expect(armor.levels['16']!.mechanics?.armor).toBe(32);
  });

  it('matches canonical JSON progressions for all seven new powers', () => {
    const ref = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as {
      powers: Record<string, Array<{ PL: number; available: boolean; value: number | null; radius: number | null }>>;
    };
    const byId: Record<string, string> = {
      'ab-armor-reduction': 'Armor Reduction',
      'ab-enemy-evade-reduction': 'Enemy Evade Reduction',
      'ab-spell-resistance-piercing': 'Spell Resistance Piercing',
      'ab-maximization': 'Maximization',
      'ab-armor-reduction-aura': 'Armor Reduction Aura',
      'ab-allied-damage-aura': 'Allied Damage Aura',
      'ab-area-expansion': 'Area Expansion',
    };
    for (const [id, key] of Object.entries(byId)) {
      const tpl = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id)!;
      expect(tpl, id).toBeTruthy();
      expect(Object.keys(tpl.levels)).toHaveLength(16);
      const rows = ref.powers[key]!;
      expect(rows).toHaveLength(16);
      for (const row of rows) {
        const lvl = tpl.levels[String(row.PL) as keyof typeof tpl.levels]!;
        const mech = lvl.mechanics ?? {};
        if (!row.available) {
          if (id === 'ab-maximization') expect(mech.maximization).toBeUndefined();
          if (id === 'ab-area-expansion') expect(mech.areaExpansionM).toBeUndefined();
          if (id === 'ab-allied-damage-aura') expect(mech.alliedDamageAura).toBeUndefined();
          if (id === 'ab-armor-reduction-aura') expect(mech.armorReductionAura).toBeUndefined();
          continue;
        }
        if (id === 'ab-armor-reduction') expect(mech.armorReduction).toBe(row.value);
        if (id === 'ab-enemy-evade-reduction') expect(mech.enemyEvadeReduction).toBe(row.value);
        if (id === 'ab-spell-resistance-piercing') expect(mech.spellResistancePiercing).toBe(row.value);
        if (id === 'ab-maximization') expect(mech.maximization).toBe(row.value);
        if (id === 'ab-area-expansion') expect(mech.areaExpansionM).toBe(row.value);
        if (id === 'ab-armor-reduction-aura') {
          expect(mech.armorReductionAura).toEqual({ reduction: row.value, radiusM: row.radius });
        }
        if (id === 'ab-allied-damage-aura') {
          expect(mech.alliedDamageAura).toEqual({ dice: row.value, radiusM: row.radius });
        }
      }
    }
  });

  it('technical names are exact', () => {
    const names = NEW_IDS.map(
      (id) => ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id)!.name,
    );
    expect(names).toEqual([
      'Active Buff: Armor Reduction',
      'Active Buff: Enemy Evade Reduction',
      'Active Buff: Spell Resistance Piercing',
      'Active Buff: Maximization',
      'Active Buff: Armor Reduction Aura',
      'Active Buff: Allied Damage Aura',
      'Active Buff: Area Expansion',
    ]);
  });

  it('Focus Offensive 12 / Defensive 14 / All 25', () => {
    expect(filterCatalog({ category: 'activeBuff' })).toHaveLength(25);
    expect(filterCatalog({ category: 'activeBuff', uiActiveBuffFocus: 'offensive' })).toHaveLength(12);
    expect(filterCatalog({ category: 'activeBuff', uiActiveBuffFocus: 'defensive' })).toHaveLength(14);
  });

  it('runtime: personal Armor Reduction / Evade / SR piercing / Maximization / Area Expansion', () => {
    const ar = mockBuffActor({ armorReduction: 17 });
    expect(getActiveBuffArmorReduction(ar)).toBe(17);

    const evadeBuff = mockBuffActor({ enemyEvadeReduction: 4 });
    expect(getActiveBuffEnemyEvadeReduction(evadeBuff)).toBe(4);
    const target = {
      system: { combat: { evadeTotal: 10, evadeFromActiveBuffs: 0 } },
    };
    expect(getTargetEvade(target, evadeBuff)).toBe(6);

    const pierce = mockBuffActor({ spellResistancePiercing: 5 });
    expect(getActiveBuffSpellResistancePiercing(pierce)).toBe(5);
    expect(getCasterSpellPenetration(pierce)).toBe(5);

    const max = mockBuffActor({ maximization: 2 });
    expect(getActiveBuffMaximizationUses(max)).toBe(2);

    const area = mockBuffActor({ areaExpansionM: 2 });
    expect(getActiveBuffAreaExpansionMeters(area)).toBe(2);
    // No stone bonus → Area Expansion alone
    expect(getEffectiveCircularAoeRadiusBonusMeters(area)).toBe(2);
  });

  it('Area Expansion anti-stacks with Intellect Stone AoE (max, not sum)', () => {
    const actor = {
      id: 'Actor.a',
      effects: [
        {
          disabled: false,
          flags: {
            'mastery-system': { activeBuff: true, mechanics: { areaExpansionM: 2 } },
          },
        },
      ],
      getFlag: (_s: string, key: string) =>
        key === 'roundState' ? { stoneBonuses: { aoeRadiusBonusM: 3 } } : null,
    };
    expect(getEffectiveCircularAoeRadiusBonusMeters(actor)).toBe(3);
  });

  it('Damage Reduction Active Buff remains distinct from Armor Reduction', () => {
    const listed = filterCatalog({ category: 'activeBuff' });
    expect(listed.some((e) => e.templateId === 'ab-damage-reduction')).toBe(true);
    expect(listed.some((e) => e.templateId === 'ab-armor-reduction')).toBe(true);
    expect(listed.some((e) => e.name === 'Active Buff: Damage Aura')).toBe(true);
    expect(listed.some((e) => e.name === 'Active Buff: Allied Damage Aura')).toBe(true);
  });
});
