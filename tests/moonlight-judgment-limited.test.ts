/**
 * Moonlight Judgment — Limited Spell AoE targeted checks (catalogue 2026-10-25).
 */
import { describe, expect, it } from 'vitest';
import {
  applyLimitedPowerDamage,
  doublePrintedPowerDice,
  spellFocusDamageApplies,
  martialWeaponDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  moonlightJudgmentMaxUses,
  assertMoonlightJudgmentAvailable,
  spendMoonlightJudgmentUse,
  clearArtifactRestUses,
  ARTIFACT_REST_USES_FLAG,
} from '../src/combat/artifact-rest-uses.js';
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
  it('doubles only printed Power Dice (3/4/8 → 6/8/16)', () => {
    expect(applyLimitedPowerDamage('3d8', { limited: true })).toBe('6d8');
    expect(applyLimitedPowerDamage('4d8', { limited: true })).toBe('8d8');
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('16d8');
    expect(doublePrintedPowerDice('+3d8')).toBe('+6d8');
    expect(doublePrintedPowerDice('+4d8')).toBe('+8d8');
    expect(doublePrintedPowerDice('+8d8')).toBe('+16d8');
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
  it('shares one bucket across stages; max uses 2/5/8', () => {
    expect(moonlightJudgmentMaxUses(2)).toBe(2);
    expect(moonlightJudgmentMaxUses(5)).toBe(5);
    expect(moonlightJudgmentMaxUses(8)).toBe(8);
  });

  it('spending at L2 exhausts the shared bucket for higher stages until rest', async () => {
    const actor = restUseActor();

    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(false);
    // Same bucket — L5 raises the max to 5, so spent=2 still leaves uses.
    expect(assertMoonlightJudgmentAvailable(actor, 5)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 5)).toBe(true);
    expect(actor.flags['mastery-system'][ARTIFACT_REST_USES_FLAG].moonlightJudgment).toBe(3);
    await clearArtifactRestUses(actor);
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
