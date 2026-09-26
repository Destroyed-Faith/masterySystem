import { describe, expect, it } from 'vitest';
import {
  applySpecialBoostToLabel,
  readSpecialBoost,
} from '../src/combat/special-boost';
import {
  getCasterSpellPenetration,
  spellResistanceAfterPenetration,
} from '../src/combat/target-defenses';
import { aoeCreatureNormalTn } from '../src/combat/aoe-melee-resolution';
import { resolveStonePowerId, isRetiredStonePower } from '../src/stones/stone-powers';

function actorWith(roundState: Record<string, unknown> | null, combat?: Record<string, unknown>) {
  return {
    system: { combat: combat ?? {} },
    getFlag: (_scope: string, key: string) => (key === 'roundState' ? roundState : undefined),
  };
}

describe('DF Core 0.9.9.1 spell corners', () => {
  it('aliases Spell Raises onto Raise Focus and keeps Spell Action retired', () => {
    expect(resolveStonePowerId('intellect.spellRaises')).toBe('intellect.raiseFocus');
    expect(isRetiredStonePower('intellect.spellAction')).toBe(true);
    expect(resolveStonePowerId('intellect.spellAction')).toBe('intellect.spellAction');
  });

  it('Spell Penetration reduces only Spell Resistance and floors at 0', () => {
    const caster = actorWith({ stoneBonuses: { spellPenetration: 12 } });
    const target = actorWith(null, { spellResistanceTotal: 10 });
    expect(getCasterSpellPenetration(caster)).toBe(12);
    expect(spellResistanceAfterPenetration(target, caster)).toBe(0);
    const soft = actorWith(null, { spellResistanceTotal: 20 });
    expect(spellResistanceAfterPenetration(soft, caster)).toBe(8);
  });

  it('AoE Final Spell TN keeps the base and applies penetration per creature', () => {
    const caster = actorWith({ stoneBonuses: { spellPenetration: 4 } });
    const defender = actorWith(null, { spellResistanceTotal: 10 });
    expect(
      aoeCreatureNormalTn({
        defender,
        isSpell: true,
        spellBaseTn: 22,
        caster,
      }),
    ).toBe(28);
  });

  it('Special Boost increments every numeric Special(X) and leaves binary specials', () => {
    expect(applySpecialBoostToLabel('Lacerate(3)', 4)).toBe('Lacerate(7)');
    expect(applySpecialBoostToLabel('Slow(2), Ruin(1)', 8)).toBe('Slow(10), Ruin(9)');
    expect(applySpecialBoostToLabel('Knockdown', 4)).toBe('Knockdown');
    const actor = actorWith({ stoneBonuses: { specialBoost: 8 } });
    expect(readSpecialBoost(actor)).toBe(8);
  });
});
