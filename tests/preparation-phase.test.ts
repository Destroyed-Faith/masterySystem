import { describe, expect, it } from 'vitest';
import {
  addInitiativeColorlessStones,
  clearInitiativeColorlessStones,
  convertInitiativeToColorlessPreview,
  getSpendableColorlessStones,
  initiativeBoostAmount,
  maxConvertibleColorlessStones,
  restoreInitiativeColorlessStones,
  spendColorlessStones,
} from '../src/stones/colorless-stones';
import {
  applyInitiativeBoost,
  confirmPreparationAssignment,
  emptyPreparationPhase,
  initiativeAfterBoost,
  initiativeBoostRankCost,
  planInitiativeExchange,
  preparationStep,
  readPreparationPhase,
  reconcilePreparationPhase,
  reopenPreparationAssignment,
  skipInitiativeBoost,
} from '../src/stones/preparation-phase';

function actor() {
  const flags: Record<string, unknown> = {};
  const pools: Record<string, { current: number; max: number }> = {
    colorless: { current: 1, max: 1 },
  };
  return {
    system: { stonePools: pools },
    getFlag: (_s: string, key: string) => flags[key],
    setFlag: async (_s: string, key: string, value: unknown) => {
      flags[key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flags[key];
    },
    update: async (patch: Record<string, unknown>) => {
      if (patch['system.stonePools.colorless.current'] != null) {
        pools.colorless.current = Number(patch['system.stonePools.colorless.current']);
      }
    },
  };
}

describe('Preparation Phase — Initiative Boost then Exchange', () => {
  it('applies Initiative Boost before Initiative Exchange can read the score', () => {
    const start = emptyPreparationPhase('combat', 1);
    expect(preparationStep(start)).toBe('boost');
    const boosted = applyInitiativeBoost(start, 3);
    expect(boosted.changed).toBe(true);
    expect(preparationStep(boosted.state)).toBe('exchange');
    expect(planInitiativeExchange(start, 2).changed).toBe(false);
  });

  it('Initiative Exchange sees the boosted Initiative and can buy two Stones at MR3', () => {
    const base = 20;
    const mr = 3;
    expect(maxConvertibleColorlessStones(base, mr)).toBe(1);
    const afterBoost = initiativeAfterBoost(base, 3, mr);
    expect(afterBoost).toBe(base + initiativeBoostAmount(3, mr));
    expect(afterBoost).toBe(32);
    expect(maxConvertibleColorlessStones(afterBoost, mr)).toBe(2);
    const preview = convertInitiativeToColorlessPreview(afterBoost, 2, mr);
    expect(preview).toEqual({ stones: 2, initiativeCost: 24, remainingInitiative: 8 });
    expect(preview.remainingInitiative).toBeGreaterThanOrEqual(0);
  });

  it('does not let Initiative fall below 0', () => {
    const preview = convertInitiativeToColorlessPreview(20, 9, 3);
    expect(preview.remainingInitiative).toBeGreaterThanOrEqual(0);
    expect(preview.stones).toBe(1);
    expect(preview.initiativeCost).toBe(12);
  });

  it('buys several Initiative Colorless Stones in one Exchange', () => {
    const preview = convertInitiativeToColorlessPreview(48, 4, 3);
    expect(preview.stones).toBe(4);
    expect(preview.initiativeCost).toBe(48);
    expect(preview.remainingInitiative).toBe(0);
  });

  it('makes bought Stones Ready in the same Preparation Phase, before the next Round', async () => {
    const prep = applyInitiativeBoost(emptyPreparationPhase('combat', 1), 1).state;
    const bought = planInitiativeExchange(prep, 2);
    expect(bought.changed).toBe(true);
    expect(preparationStep(bought.state)).toBe('assignment');
    expect(bought.state.round).toBe(1);

    const pc = actor();
    await addInitiativeColorlessStones(pc, bought.stones);
    expect(getSpendableColorlessStones(pc)).toBe(1 + 2);
    expect(preparationStep(bought.state, false)).not.toBe('locked');
  });

  it('does not repurchase or duplicate Stones when Preparation is reopened', () => {
    const done = planInitiativeExchange(
      applyInitiativeBoost(emptyPreparationPhase('combat', 1), 1).state,
      2,
    ).state;
    const again = planInitiativeExchange(done, 2);
    expect(again.changed).toBe(false);
    expect(again.state.exchangeStones).toBe(2);
    const reloaded = readPreparationPhase(done, 'combat', 1);
    expect(planInitiativeExchange(reloaded, 2).changed).toBe(false);
    expect(reloaded.exchangeStones).toBe(2);
  });

  it('refuses a second Initiative Boost in the same combat', () => {
    const once = applyInitiativeBoost(emptyPreparationPhase('combat', 1), 2);
    const twice = applyInitiativeBoost(once.state, 4);
    expect(twice.changed).toBe(false);
    expect(twice.state.boostTier).toBe(2);

    const nextRound = readPreparationPhase(once.state, 'combat', 2);
    const reconciled = reconcilePreparationPhase(nextRound, { boostAlreadyUsed: true });
    expect(preparationStep(reconciled)).toBe('exchange');
    expect(applyInitiativeBoost(reconciled, 1).changed).toBe(false);
  });

  it('locks Exchange after Stone Assignment is confirmed', () => {
    const assigned = planInitiativeExchange(
      skipInitiativeBoost(emptyPreparationPhase('combat', 1)).state,
      2,
    ).state;
    const locked = confirmPreparationAssignment(assigned);
    expect(preparationStep(locked)).toBe('locked');
    expect(planInitiativeExchange(locked, 1).changed).toBe(false);
    expect(locked.exchangeStones).toBe(2);
    expect(applyInitiativeBoost(locked, 1).changed).toBe(false);
  });

  it('keeps Initiative Colorless Stones through the combat and drops them when combat ends', async () => {
    const locked = confirmPreparationAssignment(
      planInitiativeExchange(skipInitiativeBoost(emptyPreparationPhase('combat', 1)).state, 2).state,
    );
    expect(locked.exchangeStones).toBe(2);
    const pc = actor();
    await addInitiativeColorlessStones(pc, locked.exchangeStones);
    await spendColorlessStones(pc, 1);
    const back = await restoreInitiativeColorlessStones(pc, 1);
    expect(back).toBe(1);
    expect(getSpendableColorlessStones(pc)).toBe(1 + 2);
    await clearInitiativeColorlessStones(pc);
    expect(getSpendableColorlessStones(pc)).toBe(1);
  });

  it('a fresh round does not carry the previous Exchange, and a skip is not a spent Boost', () => {
    const skipped = skipInitiativeBoost(emptyPreparationPhase('combat', 1)).state;
    expect(preparationStep(skipped)).toBe('exchange');
    const next = readPreparationPhase(skipped, 'combat', 2);
    expect(next.boost).toBe('pending');
    expect(next.exchange).toBe('pending');
    expect(initiativeBoostRankCost(1)).toBe(1);
    expect(initiativeBoostRankCost(2)).toBe(3);
    expect(initiativeBoostRankCost(4)).toBe(15);
  });

  it('GM reset reopens assignment without buying the Stones again', () => {
    const locked = confirmPreparationAssignment(
      planInitiativeExchange(skipInitiativeBoost(emptyPreparationPhase('combat', 1)).state, 2).state,
    );
    const reopened = reopenPreparationAssignment(locked);
    expect(preparationStep(reopened)).toBe('assignment');
    expect(planInitiativeExchange(reopened, 2).changed).toBe(false);
    expect(reopened.exchangeStones).toBe(2);
  });
});
