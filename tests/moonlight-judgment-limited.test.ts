/**
 * Moonlight Judgment — Limited Spell AoE targeted checks (C07 / 2026-11-04).
 */
import { describe, expect, it } from 'vitest';
import {
  applyLimitedPowerDamage,
  spellFocusDamageApplies,
  martialWeaponDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  moonlightJudgmentMaxUses,
  assertMoonlightJudgmentAvailable,
  spendMoonlightJudgmentUse,
} from '../src/combat/artifact-rest-uses.js';
import {
  clearLimitedCharge,
  isLimitedChargeAvailable,
  LIMITED_CHARGE_FLAG,
} from '../src/combat/limited-charge.js';
import { aoeCreatureNormalTn } from '../src/combat/aoe-melee-resolution.js';
import { castingBaseTnForPowerLevel } from '../src/combat/spell-roll-handler.js';

function restUseActor() {
  const actor: any = {
    flags: { 'mastery-system': {} },
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (this.flags?.[scope]) delete this.flags[scope][key];
    },
  };
  return actor;
}

describe('Moonlight Judgment Limited damage', () => {
  it('quadruples only printed Power Dice (3/4/8 → 12/16/32)', () => {
    expect(applyLimitedPowerDamage('3d8', { limited: true })).toBe('12d8');
    expect(applyLimitedPowerDamage('4d8', { limited: true })).toBe('16d8');
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('32d8');
  });

  it('Spell Instant Damage AoE keeps Spell Focus; martial Weapon stays off for spells', () => {
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        isNpcAttackFlow: false,
        instantAoe: true,
      }),
    ).toBe(true);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: true,
        powerIsSpell: true,
        instantAoe: true,
      }),
    ).toBe(false);
    expect(
      spellFocusDamageApplies({
        isSpell: true,
        isNpcAttackFlow: false,
        instantAoe: false,
      }),
    ).toBe(true);
  });
});

describe('Moonlight Judgment use ledger', () => {
  it('shares the global Limited charge (always 1 max use)', () => {
    expect(moonlightJudgmentMaxUses(2)).toBe(1);
    expect(moonlightJudgmentMaxUses(5)).toBe(1);
    expect(moonlightJudgmentMaxUses(8)).toBe(1);
  });

  it('one spend exhausts Judgment at every stage until Safe Haven Rest', async () => {
    const actor = restUseActor();

    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(false);
    expect(assertMoonlightJudgmentAvailable(actor, 5)).toBe(false);
    expect(assertMoonlightJudgmentAvailable(actor, 8)).toBe(false);
    expect(isLimitedChargeAvailable(actor)).toBe(false);
    expect(actor.flags['mastery-system'][LIMITED_CHARGE_FLAG]).toBe(true);
    await clearLimitedCharge(actor);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
  });
});

describe('Moonlight Judgment Spell AoE TN', () => {
  it('uses Spell Base TN PL×4 + SR, not Evade', () => {
    expect(castingBaseTnForPowerLevel(4)).toBe(16);
    expect(castingBaseTnForPowerLevel(10)).toBe(40);
    expect(castingBaseTnForPowerLevel(16)).toBe(64);
    const defender = {
      system: { combat: { evadeTotal: 12, spellResistanceTotal: 3 } },
    };
    const spellTn = aoeCreatureNormalTn({
      defender,
      isSpell: true,
      spellBaseTn: castingBaseTnForPowerLevel(4),
      caster: {},
      willing: false,
    });
    const evadeTn = aoeCreatureNormalTn({
      defender,
      isSpell: false,
      spellBaseTn: null,
      caster: {},
      willing: false,
    });
    expect(spellTn).toBe(16 + 3);
    expect(evadeTn).toBe(12);
    expect(spellTn).not.toBe(evadeTn);
  });
});
