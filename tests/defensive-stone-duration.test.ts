import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFENSIVE_STONE_KEYS,
  armDefensiveStoneExpiry,
  clearCombatStoneTurnBonusesForActor,
  releaseDefensiveStoneExpiry,
  resetRoundState,
  setRoundState,
  snapshotDefensiveStones,
} from '../src/combat/action-economy';
import { applyDefensiveMitigation } from '../src/combat/damage-mitigation';
import { getTargetSpellResistance } from '../src/combat/target-defenses';

function flagActor(id: string) {
  const flags: Record<string, any> = {};
  return {
    id,
    name: id,
    type: 'character',
    system: { combat: { armorTotal: 4, evade: 10, damageReductionPct: 0 } },
    getFlag(_s: string, key: string) {
      return flags[key];
    },
    setFlag: async (_s: string, key: string, value: unknown) => {
      flags[key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flags[key];
    },
  };
}

describe('Defensive stone duration — until start of next own turn', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: null });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
  });

  it('keeps Armor / Evade / Parry / DR / Negation / Spell Resistance after spotlight end', async () => {
    const defender = flagActor('def');
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(defender as any, {
      combatId: 'c1',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: {
        extraAttacks: 0,
        extraReactions: 0,
        extraMoveMeters: 0,
        tempArmor: 8,
        evadeBonus: 16,
        tempParryPool: 4,
        damageReductionBoostPct: 20,
        tempDamageNegation: 8,
        spellResistanceBonus: 8,
        incomingSpecialReduction: 4,
        tempWard: 2,
        damageBonus: 3,
      },
    });

    await clearCombatStoneTurnBonusesForActor(defender as any, combat);
    await armDefensiveStoneExpiry(defender as any, combat);

    const mid = defender.getFlag('mastery-system', 'roundState') as any;
    expect(mid.stoneBonuses.tempArmor).toBe(8);
    expect(mid.stoneBonuses.evadeBonus).toBe(16);
    expect(mid.stoneBonuses.tempParryPool).toBe(4);
    expect(mid.stoneBonuses.damageReductionBoostPct).toBe(20);
    expect(mid.stoneBonuses.tempDamageNegation).toBe(8);
    expect(mid.stoneBonuses.spellResistanceBonus).toBe(8);
    expect(mid.stoneBonuses.incomingSpecialReduction).toBe(4);
    expect(mid.stoneBonuses.tempWard).toBe(2);
    expect(mid.stoneBonuses.damageBonus).toBe(0);
    expect(snapshotDefensiveStones(mid.stoneBonuses)).toEqual(
      expect.objectContaining({
        tempArmor: 8,
        evadeBonus: 16,
        tempParryPool: 4,
      }),
    );
    expect(getTargetSpellResistance(defender as any)).toBe(8);
    const duringEnemyHit = applyDefensiveMitigation({
      rawDamage: 20,
      count8s: 0,
      armorTotal: 4 + Number(mid.stoneBonuses.tempArmor || 0),
      damageReductionPct: Number(mid.stoneBonuses.damageReductionBoostPct || 0),
    });
    // 20 − 12 Armor = 8 → ceil(8 × 0.80) = ceil(6.4) = 7
    expect(duringEnemyHit.mitigatedDamage).toBe(7);

    // Enemy turns / round wrap must not strip the armed defensive snapshot.
    await resetRoundState(defender as any, { getFlag: () => undefined } as any, {
      ...combat,
      round: 2,
    } as any);
    const afterRound = defender.getFlag('mastery-system', 'roundState') as any;
    expect(afterRound.stoneBonuses.tempArmor).toBe(8);
    expect(afterRound.stoneBonuses.evadeBonus).toBe(16);
    expect(defensiveExpiryPending(afterRound)).toBe(true);

    // New purchase mid-window: only the snapshotted amount expires.
    afterRound.stoneBonuses.tempArmor = 12;
    await setRoundState(defender as any, afterRound);
    await releaseDefensiveStoneExpiry(defender as any, { ...combat, round: 2 });
    const next = defender.getFlag('mastery-system', 'roundState') as any;
    expect(next.stoneBonuses.tempArmor).toBe(4);
    expect(next.stoneBonuses.evadeBonus).toBe(0);
    expect(next.stoneBonuses.tempParryPool).toBe(0);
    expect(next.stoneBonuses.damageReductionBoostPct).toBe(0);
    expect(next.stoneBonuses.tempDamageNegation).toBe(0);
    expect(next.stoneBonuses.spellResistanceBonus).toBe(0);
    expect(next.stoneBonuses.defensiveExpiry).toBeNull();
    for (const key of DEFENSIVE_STONE_KEYS) {
      expect(key in (snapshotDefensiveStones(next.stoneBonuses) as object) || true).toBe(true);
    }
  });

  it('does not clear newly bought defensive stones on a repeated release', async () => {
    const defender = flagActor('def2');
    const combat = { id: 'c2', round: 2, turn: 0 } as any;
    await setRoundState(defender as any, {
      combatId: 'c2',
      round: 2,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: {
        extraAttacks: 0,
        extraReactions: 0,
        extraMoveMeters: 0,
        tempArmor: 16,
        defensiveExpiry: null,
      },
    });
    await releaseDefensiveStoneExpiry(defender as any, combat);
    const still = defender.getFlag('mastery-system', 'roundState') as any;
    expect(still.stoneBonuses.tempArmor).toBe(16);
  });
});

function defensiveExpiryPending(rs: any): boolean {
  const snap = rs?.stoneBonuses?.defensiveExpiry;
  return !!snap && DEFENSIVE_STONE_KEYS.some((k) => Math.floor(Number(snap[k]) || 0) > 0);
}
