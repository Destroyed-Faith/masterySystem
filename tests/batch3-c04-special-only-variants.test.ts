/**
 * Batch 3 C04 Abschluss — Special-only Attacks across all four delivery variants
 * (Melee/Ranged × Single Target/AoE) for Martial and Spell delivery.
 */
import { describe, expect, it } from 'vitest';
import {
  isSpecialOnlyAttack,
  isSpecialOnlyTemplateId,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import { withInstantAoeFlags } from '../src/combat/aoe-melee-resolution.js';
import { shouldSpendMaximizationAfterNegation } from '../src/combat/maximization-order.js';
import {
  buildAvailableRaiseOptions,
  bindChosenSpecialIntoLevelData,
  type PowerSnapshot,
} from '../src/combat/raise-resolution.js';
import { getTemplate } from '../src/utils/powers/index.js';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives.js';
import { instantSpecialRank } from '../src/utils/powers/instant-special-ranks.js';

const ST_SPECIAL_ONLY = [
  'active-melee-instant-special-t3',
  'active-ranged-instant-special-t3',
  'active-melee-instant-special-t4',
  'active-ranged-instant-special-t4',
  'active-melee-instant-special-t5',
  'active-ranged-instant-special-t5',
  'active-melee-instant-special-t6',
  'active-ranged-instant-special-t6',
] as const;

const AOE_SPECIAL_ONLY = [
  'active-melee-aoe-damage-t3',
  'active-ranged-aoe-damage-t3',
  'active-melee-aoe-damage-t4',
  'active-ranged-aoe-damage-t4',
  'active-melee-aoe-damage-t5',
  'active-ranged-aoe-damage-t5',
  'active-melee-aoe-damage-t6',
  'active-ranged-aoe-damage-t6',
  'active-melee-aoe-targeted-special',
  'active-ranged-aoe-targeted-special',
] as const;

const DAMAGE_PLUS_SPECIAL = [
  'active-melee-damage-t3',
  'active-ranged-damage-t4',
  'active-melee-damage-t5',
  'active-ranged-damage-t6',
  'active-melee-targeted-special',
  'active-ranged-targeted-special',
  'active-melee-weapon-aoe',
  'active-ranged-weapon-aoe',
] as const;

function assertZeroDamageAxes(templateId: string, extras: Record<string, unknown> = {}) {
  const flags = { selectedPowerTemplateId: templateId, ...extras };
  expect(isSpecialOnlyTemplateId(templateId), templateId).toBe(true);
  expect(isSpecialOnlyAttack(flags), templateId).toBe(true);
  expect(martialWeaponDamageApplies(flags as any), templateId).toBe(false);
  expect(spellFocusDamageApplies({ isSpell: true, ...flags }), templateId).toBe(false);
  expect(
    shouldSpendMaximizationAfterNegation({
      wantMaximization: true,
      remainingDice: 8,
      specialOnly: true,
    }),
  ).toBe(false);
}

describe('C04 — catalog identity for Special-only Actives', () => {
  it('registers all Instant Single-Special ST templates', () => {
    for (const id of ST_SPECIAL_ONLY) {
      const tpl = ACTIVE_TEMPLATES.find((t) => t.templateId === id);
      expect(tpl, id).toBeTruthy();
      expect(tpl!.subfamily).toBe('instant-special-single');
      const row1: any = (tpl!.levels as any)['1'];
      expect(row1.mechanics.specialOnly).toBe(true);
      expect(row1.mechanics.damageRider).toBeUndefined();
      expect(row1.effect.dice).toBeUndefined();
    }
  });

  it('classifies every Special-only template id the same way everywhere', () => {
    for (const id of [...ST_SPECIAL_ONLY, ...AOE_SPECIAL_ONLY]) {
      assertZeroDamageAxes(id);
    }
  });

  it('does not mislabel Damage+Special or Weapon AoE as Special-only', () => {
    for (const id of DAMAGE_PLUS_SPECIAL) {
      expect(isSpecialOnlyTemplateId(id), id).toBe(false);
      expect(isSpecialOnlyAttack({ selectedPowerTemplateId: id }), id).toBe(false);
    }
  });
});

describe('C04 — four delivery variants (Martial + Spell)', () => {
  it('Melee Single Target Instant Special blocks every damage axis', () => {
    assertZeroDamageAxes('active-melee-instant-special-t4', {
      attackType: 'melee',
      powerIsSpell: false,
    });
  });

  it('Ranged Single Target Instant Special — Martial and Spell', () => {
    assertZeroDamageAxes('active-ranged-instant-special-t4', {
      attackType: 'ranged',
      powerIsSpell: false,
    });
    assertZeroDamageAxes('active-ranged-instant-special-t4', {
      attackType: 'ranged',
      powerIsSpell: true,
      ignoreWeaponDamage: true,
    });
  });

  it('Melee AoE Special-only keeps zero shared pool (Martial)', () => {
    const flags = withInstantAoeFlags({
      selectedPowerTemplateId: 'active-melee-aoe-damage-t4',
      powerIsSpell: false,
    });
    expect(flags.specialOnly).toBe(true);
    expect(flags.ignoreWeaponDamage).toBe(true);
    expect(martialWeaponDamageApplies(flags)).toBe(false);
  });

  it('Ranged AoE Special-only — Martial and Spell Focus both blocked', () => {
    const martial = withInstantAoeFlags({
      selectedPowerTemplateId: 'active-ranged-aoe-damage-t5',
      powerIsSpell: false,
    });
    expect(martial.specialOnly).toBe(true);
    expect(martialWeaponDamageApplies(martial)).toBe(false);

    const spell = withInstantAoeFlags({
      selectedPowerTemplateId: 'active-ranged-aoe-damage-t5',
      powerIsSpell: true,
      ignoreWeaponDamage: true,
    });
    expect(spellFocusDamageApplies({ isSpell: true, ...spell })).toBe(false);
  });

  it('Attack/Casting roll still applies — only Damage Raises are absent', () => {
    const snap: PowerSnapshot = {
      damageDice: 0,
      specials: [{ key: 'ruin', rank: 5 }],
      rangeM: null,
      aoeRadiusM: null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: false,
      hasDuration: false,
    };
    const opts = buildAvailableRaiseOptions(snap, false, { hasWeaponDamage: false });
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.every((o) => o.effect === 'specialPlus')).toBe(true);
    expect(opts.some((o) => o.effect === 'damage')).toBe(false);
  });
});

describe('C04 — Instant Single-Special printed ranks bind per Special', () => {
  it('binds Blight / Challenge / Ruin from the Instant Special tables', () => {
    const tpl = getTemplate('active-melee-instant-special-t3')!;
    const blight = bindChosenSpecialIntoLevelData(
      (tpl.levels as any)['1'],
      'blight',
      'active-melee-instant-special-t3',
      1,
    );
    expect(blight.specials[0]).toEqual(expect.objectContaining({ key: 'blight', rank: 4 }));
    expect(instantSpecialRank('melee', 'blight', 1)).toBe(4);

    const challengeTpl = getTemplate('active-melee-instant-special-t5')!;
    const challenge = bindChosenSpecialIntoLevelData(
      (challengeTpl.levels as any)['1'],
      'challenge',
      'active-melee-instant-special-t5',
      1,
    );
    expect(challenge.specials[0]).toEqual(expect.objectContaining({ key: 'challenge', rank: 1 }));

    const ruinTpl = getTemplate('active-melee-instant-special-t4')!;
    const ruin = bindChosenSpecialIntoLevelData(
      (ruinTpl.levels as any)['8'],
      'ruin',
      'active-melee-instant-special-t4',
      8,
    );
    expect(ruin.specials[0]).toEqual(
      expect.objectContaining({ key: 'ruin', rank: instantSpecialRank('melee', 'ruin', 8) }),
    );
  });

  it('Ranged Instant Special ranks differ from Melee where the rules print differently', () => {
    expect(instantSpecialRank('melee', 'blight', 3)).toBe(7);
    expect(instantSpecialRank('ranged', 'blight', 3)).toBe(6);
  });
});

describe('C04 — bypass gates (Weapon / Focus / Max / buffs / raises)', () => {
  it('flag bag alone without specialOnly still classifies via template id', () => {
    expect(
      isSpecialOnlyAttack({
        selectedPowerTemplateId: 'active-melee-instant-special-t3',
        // no specialOnly flag — classifier must still catch it
      }),
    ).toBe(true);
  });

  it('explicit specialOnly flag works even without a known template id', () => {
    expect(isSpecialOnlyAttack({ specialOnly: true })).toBe(true);
    expect(martialWeaponDamageApplies({ specialOnly: true } as any)).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, specialOnly: true })).toBe(false);
  });
});
