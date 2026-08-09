import { describe, expect, it, vi } from 'vitest';

const states = new Map<string, any>();

vi.mock('../src/combat/action-economy.js', () => ({
  getActionEconomyActor: (a: any) => a,
  getRoundState: (actor: any) => {
    const id = String(actor?.id ?? 'a');
    if (!states.has(id)) {
      states.set(id, {
        combatId: 'c1',
        round: 1,
        turn: 0,
        isPC: true,
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 0 },
        reactionActions: { total: 1, used: 0 },
        moveBonusMeters: 0,
        stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      });
    }
    return states.get(id);
  },
  setRoundState: async (actor: any, state: any) => {
    states.set(String(actor?.id ?? 'a'), { ...state });
  },
}));

import {
  applyParryDiceStrip,
  buildDamageFormula,
  buildReflectionFormula,
  buildRiposteFormula,
  computeParryPoolMax,
  computeParryStrip,
  enterParry,
  findPassiveParryItem,
  isReflectionReaction,
  isRiposteReaction,
  parryPoolCapForLevel,
  resolveEquippedWeaponDamageFormula,
} from '../src/combat/parry';
import { getRoundState } from '../src/combat/action-economy';

describe('parry strip math', () => {
  it('spends 1:1 and marks Fully Parried at 0 dice', () => {
    expect(computeParryStrip(6, 6)).toEqual({
      spent: 6,
      remainingDice: 0,
      remainingPool: 0,
      fullyParried: true,
    });
    expect(computeParryStrip(8, 3)).toEqual({
      spent: 3,
      remainingDice: 5,
      remainingPool: 0,
      fullyParried: false,
    });
    expect(computeParryStrip(4, 10)).toEqual({
      spent: 4,
      remainingDice: 0,
      remainingPool: 6,
      fullyParried: true,
    });
    expect(computeParryStrip(0, 5).fullyParried).toBe(false);
  });

  it('caps pool at 5 × level', () => {
    expect(parryPoolCapForLevel(1)).toBe(5);
    expect(parryPoolCapForLevel(4)).toBe(20);
  });
});

describe('parry enter + strip persistence', () => {
  function makeDefender(id: string, opts?: { might?: number; agility?: number; level?: number }) {
    states.delete(id);
    return {
      id,
      name: 'Defender',
      type: 'character',
      system: {
        attributes: {
          might: { value: opts?.might ?? 8 },
          agility: { value: opts?.agility ?? 4 },
        },
      },
      items: [
        {
          id: 'pp',
          type: 'power',
          name: 'Parry',
          system: { powerType: 'passive', templateId: 'passive-parry', level: opts?.level ?? 2 },
        },
        {
          id: 'w1',
          type: 'weapon',
          name: 'Sword',
          system: { equipped: true, damage: '3d8' },
        },
      ],
    } as any;
  }

  it('finds Passive Parry and computes pool from Might/Agility', () => {
    const def = makeDefender('def-pool', { might: 8, agility: 12, level: 2 });
    expect(findPassiveParryItem(def)?.id).toBe('pp');
    const pool = computeParryPoolMax(def)!;
    expect(pool.attribute).toBe('agility');
    expect(pool.max).toBe(10); // min(12, 5*2)
  });

  it('enterParry sets pool and spends Attack Actions', async () => {
    const def = makeDefender('def-enter', { might: 8, level: 2 });
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    const result = await enterParry(def, combat);
    expect(result.ok).toBe(true);
    expect(result.pool).toBe(8);
    const rs = getRoundState(def, combat);
    expect(rs.parry?.entered).toBe(true);
    expect(rs.parry?.pool).toBe(8);
    expect(rs.attackActions.used).toBe(rs.attackActions.total);
    expect(rs.baseAttackLocked).toBe(true);
  });

  it('applyParryDiceStrip Fully Parries and depletes pool', async () => {
    const def = makeDefender('def-strip', { might: 6, level: 2 });
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await enterParry(def, combat);
    const strip = await applyParryDiceStrip(def, combat, 6);
    expect(strip.fullyParried).toBe(true);
    expect(strip.spent).toBe(6);
    expect(strip.remainingDice).toBe(0);
    expect(getRoundState(def, combat).parry?.pool).toBe(0);
  });

  it('builds Riposte / Reflection formulas', () => {
    const def = makeDefender('def-formula');
    expect(resolveEquippedWeaponDamageFormula(def)).toBe('3d8');
    expect(buildRiposteFormula(def, '+2d8')).toBe('3d8+2d8');
    expect(buildDamageFormula('2d8', '3d8')).toBe('2d8+3d8');
    expect(
      buildReflectionFormula(
        0,
        { items: [{ type: 'weapon', system: { equipped: true, damage: '4d8' } }] },
        '+1d8',
      ),
    ).toBe('4d8+1d8');
    expect(buildReflectionFormula(12, null, '+2d8')).toBe('12+2d8');
    expect(isRiposteReaction({ system: { templateId: 'reaction-riposte' } })).toBe(true);
    expect(isReflectionReaction({ system: { templateId: 'reaction-parry-reflection' } })).toBe(
      true,
    );
  });
});
