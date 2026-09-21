import { beforeEach, describe, expect, it } from 'vitest';
import {
  addInitiativeColorlessStones,
  addTempColorlessStones,
  clearInitiativeColorlessStones,
  colorlessStoneInitiativeCost,
  convertInitiativeToColorlessPreview,
  convertInitiativeToColorlessStones,
  dropItemColorlessStones,
  getInitiativeColorlessStones,
  getItemColorlessStones,
  getTempColorlessStones,
  initiativeBoostAmount,
  maxConvertibleColorlessStones,
  spendTempColorlessStones,
} from '../src/stones/colorless-stones';

describe('Initiative Exchange → Colorless Stones', () => {
  it('costs 4 × Mastery Rank Initiative per stone', () => {
    expect(colorlessStoneInitiativeCost(2)).toBe(8);
    expect(colorlessStoneInitiativeCost(3)).toBe(12);
    expect(colorlessStoneInitiativeCost(8)).toBe(32);
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
    expect(initiativeBoostAmount(5, 3)).toBe(48);
  });
});

function mockColorlessActor(id = 'pc') {
  const own: Record<string, unknown> = {};
  return {
    id,
    type: 'character',
    name: 'PC',
    system: { mastery: { rank: 2 } },
    getFlag: (_scope: string, key: string) => own[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      own[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete own[key];
    },
  };
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

  it('spends Initiative leftovers first', async () => {
    const actor = mockColorlessActor();
    await addInitiativeColorlessStones(actor, 2);
    await addTempColorlessStones(actor, 1);
    await spendTempColorlessStones(actor, 1);
    expect(getTempColorlessStones(actor)).toBe(2);
    expect(getInitiativeColorlessStones(actor)).toBe(1);
    expect(getItemColorlessStones(actor)).toBe(1);
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
