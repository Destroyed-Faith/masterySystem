import { beforeEach, describe, expect, it } from 'vitest';
import {
  addInitiativeColorlessStones,
  addTempColorlessStones,
  clearInitiativeColorlessStones,
  colorlessStoneInitiativeCost,
  convertInitiativeToColorlessPreview,
  convertInitiativeToColorlessStones,
  dropItemColorlessStones,
  getExhaustedInitiativeColorlessStones,
  getInitiativeColorlessStones,
  getInitiativeColorlessTotal,
  getItemColorlessStones,
  getPermanentColorlessStones,
  getSpendableColorlessStones,
  getTempColorlessStones,
  initiativeBoostAmount,
  maxConvertibleColorlessStones,
  restoreInitiativeColorlessStones,
  spendColorlessStones,
  spendTempColorlessStones,
} from '../src/stones/colorless-stones';

describe('Initiative Exchange → Colorless Stones', () => {
  it('costs 4 × Mastery Rank Initiative per stone', () => {
    expect(colorlessStoneInitiativeCost(2)).toBe(8);
    expect(colorlessStoneInitiativeCost(3)).toBe(12);
    expect(colorlessStoneInitiativeCost(4)).toBe(16);
    expect(colorlessStoneInitiativeCost(8)).toBe(32);
  });

  it('MR4: 16 Initiative buys one stone, each further stone needs the full cost', () => {
    expect(maxConvertibleColorlessStones(16, 4)).toBe(1);
    expect(maxConvertibleColorlessStones(31, 4)).toBe(1);
    expect(maxConvertibleColorlessStones(32, 4)).toBe(2);
    expect(convertInitiativeToColorlessPreview(32, 2, 4)).toEqual({
      stones: 2,
      initiativeCost: 32,
      remainingInitiative: 0,
    });
  });

  it('converts only whole stones and never drops Initiative below 0', () => {
    expect(maxConvertibleColorlessStones(24, 3)).toBe(2);
    expect(convertInitiativeToColorlessPreview(24, 2, 3)).toEqual({
      stones: 2,
      initiativeCost: 24,
      remainingInitiative: 0,
    });
    expect(convertInitiativeToColorlessPreview(24, 9, 3).stones).toBe(2);
    expect(convertInitiativeToColorlessPreview(7, 1, 2).stones).toBe(0);
  });
});

describe('Initiative Boost amount', () => {
  it('is 1/2/4/8 × Mastery Rank', () => {
    expect(initiativeBoostAmount(1, 3)).toBe(3);
    expect(initiativeBoostAmount(2, 3)).toBe(6);
    expect(initiativeBoostAmount(3, 3)).toBe(12);
    expect(initiativeBoostAmount(4, 3)).toBe(24);
    expect(initiativeBoostAmount(5, 3)).toBe(0);
  });
});

function mockColorlessActor(id = 'pc', permanentColorless = 0) {
  const own: Record<string, unknown> = {};
  const actor = {
    id,
    type: 'character',
    name: 'PC',
    system: {
      mastery: { rank: 2 },
      stonePools:
        permanentColorless > 0
          ? { colorless: { current: permanentColorless, max: permanentColorless } }
          : {},
    } as any,
    getFlag: (_scope: string, key: string) => own[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      own[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete own[key];
    },
    update: async (patch: Record<string, unknown>) => {
      if ('system.stonePools.colorless.current' in patch) {
        actor.system.stonePools.colorless.current = Number(
          patch['system.stonePools.colorless.current'],
        );
      }
    },
  };
  return actor;
}

describe('Colorless Stone sources', () => {
  beforeEach(() => {
    (globalThis as any).game = { actors: { get: () => undefined }, combat: null };
    (globalThis as any).canvas = {};
  });

  it('tags Initiative conversions and leaves Absorption grants untagged', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await addTempColorlessStones(actor, 1);
    expect(getTempColorlessStones(actor)).toBe(3);
    expect(getInitiativeColorlessStones(actor)).toBe(2);
    expect(getItemColorlessStones(actor)).toBe(1);
  });

  it('spends item-granted stones first (they vanish), Initiative stones stay Ready', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await addTempColorlessStones(actor, 1);
    await spendTempColorlessStones(actor, 1);
    expect(getTempColorlessStones(actor)).toBe(2);
    expect(getInitiativeColorlessStones(actor)).toBe(2);
    expect(getItemColorlessStones(actor)).toBe(0);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(0);
  });

  it('spent Initiative stones become Exhausted instead of disappearing', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await spendTempColorlessStones(actor, 1);
    expect(getInitiativeColorlessStones(actor)).toBe(1);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(1);
    expect(getInitiativeColorlessTotal(actor)).toBe(2);
    expect(getSpendableColorlessStones(actor)).toBe(1);
  });

  it('normal Regeneration moves Exhausted Initiative stones back to Ready', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await spendTempColorlessStones(actor, 2);
    expect(getInitiativeColorlessStones(actor)).toBe(0);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(2);

    expect(await restoreInitiativeColorlessStones(actor, 1)).toBe(1);
    expect(getInitiativeColorlessStones(actor)).toBe(1);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(1);
    // Never restores more than what is Exhausted.
    expect(await restoreInitiativeColorlessStones(actor, 5)).toBe(1);
    expect(getInitiativeColorlessStones(actor)).toBe(2);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(0);
  });

  it('end of combat drops Initiative stones, Ready or Exhausted; item stones stay', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 3);
    await addTempColorlessStones(actor, 1);
    await spendTempColorlessStones(actor, 2); // 1 item + 1 Initiative → 1 Exhausted
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(1);

    await clearInitiativeColorlessStones(actor);
    expect(getTempColorlessStones(actor)).toBe(0);
    expect(getInitiativeColorlessStones(actor)).toBe(0);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(0);
    expect(getInitiativeColorlessTotal(actor)).toBe(0);
  });

  it('drops unused Initiative after combat and keeps item stones', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await addTempColorlessStones(actor, 1);
    await clearInitiativeColorlessStones(actor);
    expect(getTempColorlessStones(actor)).toBe(1);
    expect(getInitiativeColorlessStones(actor)).toBe(0);
    expect(getItemColorlessStones(actor)).toBe(1);
  });

  it('treats untagged leftovers as Initiative except Absorption expiry', async () => {
    const leftover = mockColorlessActor('old');
    await leftover.setFlag('mastery-system', 'tempColorlessStones', 3);
    await clearInitiativeColorlessStones(leftover);
    expect(getTempColorlessStones(leftover)).toBe(0);

    const absorbed = mockColorlessActor('abs');
    await absorbed.setFlag('mastery-system', 'tempColorlessStones', 2);
    await absorbed.setFlag('mastery-system', 'absorptionStoneExpiry', { combatId: 'c1', count: 1 });
    await clearInitiativeColorlessStones(absorbed);
    expect(getTempColorlessStones(absorbed)).toBe(1);
  });

  it('Absorption expiry does not eat Initiative leftovers', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await addTempColorlessStones(actor, 1);
    expect(await dropItemColorlessStones(actor, 1)).toBe(1);
    expect(getTempColorlessStones(actor)).toBe(2);
    expect(getInitiativeColorlessStones(actor)).toBe(2);
  });

  it('convertInitiativeToColorlessStones writes the Initiative tag', async () => {
    const actor = mockColorlessActor();
    const combatant = {
      initiative: 16,
      update: async (patch: { initiative?: number }) => {
        combatant.initiative = Number(patch.initiative);
      },
      setFlag: async () => undefined,
    };
    const result = await convertInitiativeToColorlessStones(actor, combatant, 2);
    expect(result).toEqual({ stones: 2, remainingInitiative: 0 });
    expect(getTempColorlessStones(actor)).toBe(2);
    expect(getInitiativeColorlessStones(actor)).toBe(2);
  });
});

describe('Unified combat Colorless spending', () => {
  beforeEach(() => {
    (globalThis as any).game = { actors: { get: () => undefined }, combat: null };
    (globalThis as any).canvas = {};
  });

  it('spends Initiative Colorless before Permanent Colorless', async () => {
    const actor = mockColorlessActor('pc', 2);
    await addInitiativeColorlessStones(actor, 1);
    expect(getSpendableColorlessStones(actor)).toBe(3);

    expect(await spendColorlessStones(actor, 1)).toBe(true);
    expect(getExhaustedInitiativeColorlessStones(actor)).toBe(1);
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 2, max: 2 });
  });

  it('Permanent Colorless become Exhausted when spent and keep their max', async () => {
    const actor = mockColorlessActor('pc', 2);
    expect(await spendColorlessStones(actor, 1)).toBe(true);
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 1, max: 2 });
    expect(await spendColorlessStones(actor, 2)).toBe(false); // only 1 Ready left
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 1, max: 2 });
  });

  it('end of combat leaves Permanent Colorless untouched', async () => {
    const actor = mockColorlessActor('pc', 2);
    await addInitiativeColorlessStones(actor, 2);
    await spendColorlessStones(actor, 3); // 2 Initiative Exhausted + 1 Permanent Exhausted
    await clearInitiativeColorlessStones(actor);
    expect(getInitiativeColorlessTotal(actor)).toBe(0);
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 1, max: 2 });
  });

  it('Initiative Colorless never touch the Permanent pool or its cap', async () => {
    const actor = mockColorlessActor('pc', 1);
    await addInitiativeColorlessStones(actor, 4);
    // Ownership cap (≤ MR) applies to Permanent Colorless only — the
    // Initiative pile can exceed it without changing the Permanent pool.
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 1, max: 1 });
    await spendTempColorlessStones(actor, 4);
    await restoreInitiativeColorlessStones(actor, 4);
    expect(getPermanentColorlessStones(actor)).toEqual({ current: 1, max: 1 });
    expect((actor.system as any).progression).toBeUndefined();
  });
});
