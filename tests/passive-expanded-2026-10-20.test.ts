/**
 * Expanded Passives Playtest 2026-10-20 — six new Passives + selection groups.
 * Note: Destroyed_Faith_Passives_Expanded_Playtest_2026-10-20.md was unavailable;
 * formulas follow the author-approved task specification.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives';
import {
  ceilPassiveHalfLevel,
  ceilPassiveQuarterLevel,
  passiveTemporaryHpForLevel,
  passiveSpeedMetersForLevel,
} from '../src/utils/powers/templates/passives';
import {
  CANONICAL_PASSIVE_TEMPLATE_IDS,
  PASSIVE_SELECTION_GROUPS,
  PASSIVE_SELECTION_GROUP_ORDER,
  isCanonicalPassiveTemplateId,
  passiveSelectionGroupFor,
} from '../src/utils/passive-selection-groups';
import {
  getPassiveMechanicalCategories,
  passivesAreCategoryCompatible,
} from '../src/creation/tower-wizard/tower-wizard-passive-categories';
import { getTargetEvade, getCasterSpellPenetration, spellResistanceAfterPenetration } from '../src/combat/target-defenses';
import {
  applySpecialDeliveryBonuses,
  readPassiveSpecialAmplification,
  readSpecialBoost,
} from '../src/combat/special-boost';
import { movementActionMeters } from '../src/combat/movement-allowance';
import { aggregateMechanics, emptyBreakdown } from '../src/utils/power-mechanics';

function tpl(id: string) {
  return PASSIVE_TEMPLATES.find((t) => t.templateId === id);
}

function mech(id: string, pl: number) {
  return tpl(id)?.levels?.[String(pl)]?.mechanics as Record<string, unknown> | undefined;
}

describe('1. Catalogue — 28 canonical Passives × 16 PL', () => {
  it('has exactly 28 canonical template IDs and 448 level rows', () => {
    expect(CANONICAL_PASSIVE_TEMPLATE_IDS.size).toBe(28);
    let levels = 0;
    for (const id of CANONICAL_PASSIVE_TEMPLATE_IDS) {
      const t = tpl(id);
      expect(t, id).toBeTruthy();
      expect(Object.keys(t!.levels ?? {})).toHaveLength(16);
      levels += 16;
    }
    expect(levels).toBe(448);
  });

  it('each Power appears in exactly one selection group', () => {
    const seen = new Set<string>();
    for (const g of PASSIVE_SELECTION_GROUP_ORDER) {
      for (const id of PASSIVE_SELECTION_GROUPS[g]) {
        expect(seen.has(id), `duplicate ${id}`).toBe(false);
        seen.add(id);
        expect(passiveSelectionGroupFor(id)).toBe(g);
      }
    }
    expect(seen.size).toBe(28);
    expect(PASSIVE_SELECTION_GROUPS.offensive).toHaveLength(8);
    expect(PASSIVE_SELECTION_GROUPS.defensive).toHaveLength(15);
    expect(PASSIVE_SELECTION_GROUPS.utility).toHaveLength(5);
  });

  it('empower/extend meta-passives are not canonical catalogue entries', () => {
    expect(isCanonicalPassiveTemplateId('empower-buff-armor')).toBe(false);
    expect(isCanonicalPassiveTemplateId('extend-buff-evade')).toBe(false);
  });
});

describe('2. PL formula boundaries for six Passives', () => {
  it('Temporary HP = 5 × PL', () => {
    expect(passiveTemporaryHpForLevel(1)).toBe(5);
    expect(passiveTemporaryHpForLevel(4)).toBe(20);
    expect(passiveTemporaryHpForLevel(8)).toBe(40);
    expect(passiveTemporaryHpForLevel(16)).toBe(80);
    expect(mech('passive-temp-hp', 4)?.triggers).toEqual({ combatStart: { tempHP: '20' } });
  });

  it('Enemy Evade / Self Cleanse / SR Piercing = ceil(PL/2)', () => {
    expect(ceilPassiveHalfLevel(1)).toBe(1);
    expect(ceilPassiveHalfLevel(2)).toBe(1);
    expect(ceilPassiveHalfLevel(3)).toBe(2);
    expect(ceilPassiveHalfLevel(4)).toBe(2);
    expect(ceilPassiveHalfLevel(8)).toBe(4);
    expect(ceilPassiveHalfLevel(15)).toBe(8);
    expect(ceilPassiveHalfLevel(16)).toBe(8);
    expect(mech('passive-enemy-evade-reduction', 8)?.enemyEvadeReduction).toBe(4);
    expect(mech('passive-self-cleanse', 3)?.cleanseMaintenance).toBe(2);
    expect(mech('passive-spell-resistance-piercing', 16)?.spellResistancePiercing).toBe(8);
  });

  it('Speed = +PL m; Special Amplification = ceil(PL/4)', () => {
    expect(passiveSpeedMetersForLevel(1)).toBe(1);
    expect(passiveSpeedMetersForLevel(4)).toBe(4);
    expect(passiveSpeedMetersForLevel(8)).toBe(8);
    expect(passiveSpeedMetersForLevel(16)).toBe(16);
    expect(ceilPassiveQuarterLevel(1)).toBe(1);
    expect(ceilPassiveQuarterLevel(4)).toBe(1);
    expect(ceilPassiveQuarterLevel(5)).toBe(2);
    expect(ceilPassiveQuarterLevel(9)).toBe(3);
    expect(ceilPassiveQuarterLevel(13)).toBe(4);
    expect(mech('passive-speed', 8)?.speedBonus).toBe(8);
    expect(mech('passive-special-amplification', 12)?.specialAmplification).toBe(3);
  });
});

describe('3. Categories vs selection groups', () => {
  it('Health and Fortitude remain mutually exclusive; groups do not change that', () => {
    expect(passivesAreCategoryCompatible('passive-deep-vitality', 'passive-fortitude')).toBe(false);
    expect(passiveSelectionGroupFor('passive-deep-vitality')).toBe('defensive');
    expect(passiveSelectionGroupFor('passive-fortitude')).toBe('defensive');
  });

  it('each new Passive has its own mechanical category', () => {
    expect(getPassiveMechanicalCategories('passive-enemy-evade-reduction')).toEqual(['enemy-evade-reduction']);
    expect(getPassiveMechanicalCategories('passive-self-cleanse')).toEqual(['self-cleanse']);
    expect(getPassiveMechanicalCategories('passive-speed')).toEqual(['speed']);
    expect(getPassiveMechanicalCategories('passive-spell-resistance-piercing')).toEqual([
      'spell-resistance-piercing',
    ]);
    expect(getPassiveMechanicalCategories('passive-special-amplification')).toEqual(['special-amplification']);
    expect(getPassiveMechanicalCategories('passive-temp-hp')).toEqual(['temporary-hp']);
  });
});

describe('4–9. Runtime integration paths', () => {
  it('Enemy Evade Reduction cuts Evade for the attacker only', () => {
    const target: any = { system: { combat: { evadeTotal: 12, evadeFromActiveBuffs: 0 } } };
    const attacker: any = {
      getFlag: () => ({ stoneBonuses: { enemyEvadeReduction: 0 } }),
      system: { derived: { mechanicsBreakdown: { totals: { enemyEvadeReduction: 4 } } } },
    };
    expect(getTargetEvade(target, attacker)).toBe(8);
    expect(getTargetEvade(target)).toBe(12);
  });

  it('Spell Resistance Piercing reduces SR only, never Base TN math', () => {
    const target: any = {
      system: { combat: { spellResistanceTotal: 10, spellResistanceFromActiveBuffs: 0 } },
      getFlag: () => null,
    };
    const caster: any = {
      getFlag: () => ({ stoneBonuses: { spellPenetration: 2 } }),
      system: { derived: { mechanicsBreakdown: { totals: { spellResistancePiercing: 3 } } } },
    };
    expect(getCasterSpellPenetration(caster)).toBe(5);
    expect(spellResistanceAfterPenetration(target, caster)).toBe(5);
  });

  it('Special Amplification applies after Stone Special Boost', () => {
    const actor: any = {
      getFlag: () => ({ stoneBonuses: { specialBoost: 2 } }),
      system: { derived: { mechanicsBreakdown: { totals: { specialAmplification: 1 } } } },
    };
    expect(readSpecialBoost(actor)).toBe(2);
    expect(readPassiveSpecialAmplification(actor)).toBe(1);
    expect(applySpecialDeliveryBonuses('Lacerate(3)', actor)).toBe('Lacerate(6)');
  });

  it('Speed aggregates into mechanics totals; Dash doubles increased Speed once', () => {
    const bd = aggregateMechanics([
      {
        source: 'Speed',
        sourceKind: 'passive',
        mechanics: { speedBonus: 4, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.totals.speedBonus).toBe(4);
    // Base 8 + Passive Speed 4 = 12; Dash → 24; then +2 Movement Enhancement.
    expect(
      movementActionMeters({ kind: 'dash', speed: 12, enhancement: 2, reduced: false }).meters,
    ).toBe(26);
  });

  it('Self Cleanse uses cleanseMaintenance aggregation', () => {
    const bd = aggregateMechanics([
      {
        source: 'Self Cleanse',
        sourceKind: 'passive',
        mechanics: { cleanseMaintenance: 2, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.totals.cleanseMaintenance).toBe(2);
  });

  it('empty breakdown includes new total keys', () => {
    const e = emptyBreakdown();
    expect(e.totals.speedBonus).toBe(0);
    expect(e.totals.enemyEvadeReduction).toBe(0);
    expect(e.totals.spellResistancePiercing).toBe(0);
    expect(e.totals.specialAmplification).toBe(0);
  });
});

describe('10–11. Persistence helpers / existing suite anchors', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, started: true } });
  });

  it('Temp HP combatStart trigger remains one-shot sourced', () => {
    const row = mech('passive-temp-hp', 8);
    expect(row?.triggers).toEqual({ combatStart: { tempHP: '40' } });
  });

  it('Parry Extra Attack wording still present in rules doc (regression anchor)', async () => {
    const fs = await import('node:fs');
    const text = fs.readFileSync('docs/Rules/passives.md', 'utf8');
    expect(text).toMatch(/additional Attack Action/i);
    expect(text).toMatch(/Active Buff: Parry Recovery/);
  });
});
