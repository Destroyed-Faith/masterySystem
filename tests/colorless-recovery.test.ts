import { beforeEach, describe, expect, it } from 'vitest';
import { applyStoneRegenAllocation } from '../src/combat/action-economy.js';
import {
  assignLaterColorlessRecovery,
  clearColorlessRecovery,
  colorlessRecoverySpec,
  commitColorlessRecovery,
  expireTemporaryColorlessSource,
  listColorlessStones,
  readColorlessRecovery,
  syncColorlessStoneLedger,
} from '../src/stones/colorless-recovery.js';
import { addInitiativeColorlessStones, spendTempColorlessStones } from '../src/stones/colorless-stones.js';

const combat = { id: 'enc', round: 1, started: true, combatants: [] as any[] };

function makeActor(id: string) {
  const flags: Record<string, any> = {
    roundState: {
      combatId: 'enc',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      stoneBonuses: {},
    },
    preparationPhase: {
      combatId: 'enc',
      round: 1,
      boost: 'applied',
      boostTier: 0,
      exchange: 'done',
      exchangeStones: 0,
      assignment: 'open',
    },
  };
  const system: any = {
    stonePools: {
      influence: { current: 20, max: 20, sealed: 0, sustained: 0, burned: 0 },
      colorless: { current: 0, max: 2, sealed: 0, bound: 0, sustained: 0, burned: 0 },
      might: { current: 0, max: 4, sustained: 0, sealed: 0, burned: 0 },
    },
    mastery: { rank: 3 },
  };
  const actor: any = {
    id,
    name: id,
    type: 'character',
    system,
    flags,
    token: { document: { actorLink: true } },
    getFlag: (_scope: string, key: string) => flags[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      flags[key] = value;
    },
    unsetFlag: async (_scope: string, key: string) => {
      delete flags[key];
    },
    update: async (patch: Record<string, number>) => {
      for (const [path, value] of Object.entries(patch)) {
        const match = path.match(/^system\.stonePools\.(\w+)\.current$/);
        if (match?.[1] && system.stonePools[match[1]]) system.stonePools[match[1]].current = value;
      }
    },
  };
  return actor;
}

beforeEach(() => {
  (globalThis as any).game = {
    combat,
    user: { isGM: true },
    actors: { get: () => undefined },
  };
  (globalThis as any).canvas = { tokens: { placeables: [] } };
  (globalThis as any).Hooks = { callAll: () => undefined };
  (globalThis as any).ui = { notifications: { info: () => undefined, warn: () => undefined, error: () => undefined } };
});

describe('Colorless Recovery selection', () => {
  it('uses Rank costs 1/3/7/15 and capacities 2/4/8/16', () => {
    expect([1, 2, 3, 4].map((rank) => colorlessRecoverySpec(rank))).toEqual([
      { cost: 1, capacity: 2 },
      { cost: 3, capacity: 4 },
      { cost: 7, capacity: 8 },
      { cost: 15, capacity: 16 },
    ]);
  });

  it('refuses activation outside Preparation and a second activation', async () => {
    const actor = makeActor('ada');
    actor.flags.preparationPhase.assignment = 'confirmed';
    const closed = await commitColorlessRecovery({
      actor,
      combatant: {},
      rank: 1,
      selectedIds: [],
      combat,
    });
    expect(closed.ok).toBe(false);
    expect(closed.reason).toBe('preparation');
    expect(actor.system.stonePools.influence.current).toBe(20);

    actor.flags.preparationPhase.assignment = 'open';
    const first = await commitColorlessRecovery({ actor, combatant: {}, rank: 1, selectedIds: [], combat });
    expect(first.ok).toBe(true);
    const second = await commitColorlessRecovery({ actor, combatant: {}, rank: 2, selectedIds: [], combat });
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('once');
    expect(readColorlessRecovery(actor, 'enc')?.capacity).toBe(2);
    expect(actor.system.stonePools.influence.current).toBe(19);
    expect(actor.system.stonePools.influence.sealed).toBe(0);
  });

  it('exhausts the activation cost for every rank and does not Seal', async () => {
    for (const rank of [1, 2, 3, 4]) {
      const actor = makeActor(`rank-${rank}`);
      const before = actor.system.stonePools.influence.current;
      const result = await commitColorlessRecovery({ actor, combatant: {}, rank, selectedIds: [], combat });
      expect(result.ok).toBe(true);
      expect(actor.system.stonePools.influence.current).toBe(before - colorlessRecoverySpec(rank)!.cost);
      expect(actor.system.stonePools.influence.sealed).toBe(0);
      expect(readColorlessRecovery(actor, 'enc')?.capacity).toBe(colorlessRecoverySpec(rank)!.capacity);
    }
  });

  it('selects Ready and Exhausted stones, and leaves an undesignated Exhausted stone spent', async () => {
    const actor = makeActor('select');
    actor.system.stonePools.colorless.current = 1;
    actor.system.stonePools.colorless.max = 3;
    const stones = await syncColorlessStoneLedger(actor);
    const ready = stones.find((row) => row.state === 'ready')!;
    const exhausted = stones.filter((row) => row.state === 'exhausted');
    expect(exhausted).toHaveLength(2);
    const chosen = exhausted[0]!;
    const ignored = exhausted[1]!;
    const result = await commitColorlessRecovery({
      actor,
      combatant: {},
      rank: 2,
      selectedIds: [ready.id, chosen.id],
      combat,
    });
    expect(result.ok).toBe(true);
    expect(readColorlessRecovery(actor, 'enc')?.selectedIds).toEqual([ready.id, chosen.id]);
    expect(actor.system.stonePools.colorless.current).toBe(1);

    await applyStoneRegenAllocation(actor, { colorlessIds: [ignored.id], recoveryLimit: 3 });
    expect(actor.system.stonePools.colorless.current).toBe(1);
    expect(listColorlessStones(actor).find((row) => row.id === ignored.id)?.state).toBe('exhausted');

    await applyStoneRegenAllocation(actor, { colorlessIds: [chosen.id], recoveryLimit: 3 });
    expect(actor.system.stonePools.colorless.current).toBe(2);
    expect(listColorlessStones(actor).find((row) => row.id === chosen.id)?.state).toBe('ready');
    expect(listColorlessStones(actor).find((row) => row.id === ignored.id)?.state).toBe('exhausted');
  });

  it('shares one Mastery Rank limit between Attribute and designated Colorless Stones', async () => {
    const actor = makeActor('shared');
    actor.system.stonePools.colorless.max = 2;
    actor.system.stonePools.colorless.current = 0;
    const stones = await syncColorlessStoneLedger(actor);
    await commitColorlessRecovery({
      actor,
      combatant: {},
      rank: 1,
      selectedIds: stones.map((row) => row.id),
      combat,
    });
    await applyStoneRegenAllocation(actor, {
      might: 1,
      colorlessIds: stones.map((row) => row.id),
      recoveryLimit: 3,
    });
    expect(actor.system.stonePools.might.current).toBe(1);
    expect(actor.system.stonePools.colorless.current).toBe(2);

    const over = makeActor('over');
    over.system.stonePools.colorless.max = 2;
    over.system.stonePools.colorless.current = 0;
    const overStones = await syncColorlessStoneLedger(over);
    await commitColorlessRecovery({
      actor: over,
      combatant: {},
      rank: 1,
      selectedIds: overStones.map((row) => row.id),
      combat,
    });
    await applyStoneRegenAllocation(over, {
      might: 3,
      colorlessIds: overStones.map((row) => row.id),
      recoveryLimit: 3,
    });
    expect(over.system.stonePools.might.current).toBe(3);
    expect(over.system.stonePools.colorless.current).toBe(0);
  });

  it('fills a later Stone into a free slot and does not count a slot twice', async () => {
    const actor = makeActor('later');
    actor.system.stonePools.colorless.max = 1;
    actor.system.stonePools.colorless.current = 0;
    const first = await syncColorlessStoneLedger(actor);
    await commitColorlessRecovery({
      actor,
      combatant: {},
      rank: 1,
      selectedIds: [first[0]!.id],
      combat,
    });
    await addInitiativeColorlessStones(actor, 1);
    await spendTempColorlessStones(actor, 1);
    const after = await syncColorlessStoneLedger(actor);
    const newbie = after.find((row) => row.source === 'initiative');
    expect(newbie).toBeTruthy();
    const filled = await assignLaterColorlessRecovery(actor, [newbie!.id, newbie!.id, first[0]!.id]);
    expect(filled.added).toEqual([newbie!.id]);
    expect(readColorlessRecovery(actor, 'enc')?.selectedIds).toEqual([first[0]!.id, newbie!.id]);
    await addInitiativeColorlessStones(actor, 1);
    const third = (await syncColorlessStoneLedger(actor)).find(
      (row) => row.source === 'initiative' && row.id !== newbie!.id,
    );
    const blocked = await assignLaterColorlessRecovery(actor, [third!.id]);
    expect(blocked.ok).toBe(false);
    expect(readColorlessRecovery(actor, 'enc')?.selectedIds).toHaveLength(2);
  });

  it('drops a temporary Stone when its source ends and keeps the slot occupied', async () => {
    const actor = makeActor('temp');
    actor.system.stonePools.colorless.max = 0;
    await actor.setFlag('mastery-system', 'tempColorlessStones', 1);
    await actor.setFlag('mastery-system', 'absorptionReadyStones', 1);
    const stones = await syncColorlessStoneLedger(actor);
    const absorption = stones.find((row) => row.source === 'absorption');
    expect(absorption?.state).toBe('ready');
    await commitColorlessRecovery({
      actor,
      combatant: {},
      rank: 1,
      selectedIds: [absorption!.id],
      combat,
    });
    await expireTemporaryColorlessSource(actor, 'absorption');
    expect(listColorlessStones(actor).some((row) => row.id === absorption!.id)).toBe(false);
    expect(readColorlessRecovery(actor, 'enc')?.selectedIds).toContain(absorption!.id);
    expect(readColorlessRecovery(actor, 'enc')?.selectedIds).toHaveLength(1);
    await applyStoneRegenAllocation(actor, { colorlessIds: [absorption!.id], recoveryLimit: 3 });
    expect(listColorlessStones(actor).some((row) => row.id === absorption!.id)).toBe(false);
  });

  it('does not regenerate Sealed or Bound Stones', async () => {
    const sealed = makeActor('sealed');
    sealed.system.stonePools.colorless = { current: 0, max: 1, sealed: 1, bound: 0, sustained: 0, burned: 0 };
    const sealedRows = await syncColorlessStoneLedger(sealed);
    expect(sealedRows[0]?.state).toBe('sealed');
    const refused = await commitColorlessRecovery({
      actor: sealed,
      combatant: {},
      rank: 1,
      selectedIds: [sealedRows[0]!.id],
      combat,
    });
    expect(refused.reason).toBe('stone');

    const bound = makeActor('bound');
    bound.system.stonePools.colorless = { current: 0, max: 1, sealed: 0, bound: 1, sustained: 0, burned: 0 };
    const boundRows = await syncColorlessStoneLedger(bound);
    expect(boundRows[0]?.state).toBe('bound');
    await commitColorlessRecovery({ actor: bound, combatant: {}, rank: 1, selectedIds: [], combat });
    bound.flags.colorlessRecovery.selectedIds = [boundRows[0]!.id];
    await applyStoneRegenAllocation(bound, { colorlessIds: [boundRows[0]!.id], recoveryLimit: 3 });
    expect(bound.system.stonePools.colorless.current).toBe(0);
    expect(listColorlessStones(bound)[0]?.state).toBe('bound');
  });

  it('clears the designation at combat end and allows a new combat to activate', async () => {
    const actor = makeActor('reset');
    await commitColorlessRecovery({ actor, combatant: {}, rank: 1, selectedIds: [], combat });
    expect(readColorlessRecovery(actor, 'enc')?.used).toBe(true);
    await clearColorlessRecovery(actor);
    expect(actor.getFlag('mastery-system', 'colorlessRecovery')).toBeUndefined();
    const next = { ...combat, id: 'enc-2' };
    actor.flags.preparationPhase = { ...actor.flags.preparationPhase, combatId: 'enc-2' };
    actor.flags.roundState = { ...actor.flags.roundState, combatId: 'enc-2' };
    (globalThis as any).game.combat = next;
    const again = await commitColorlessRecovery({ actor, combatant: {}, rank: 2, selectedIds: [], combat: next });
    expect(again.ok).toBe(true);
    expect(readColorlessRecovery(actor, 'enc-2')?.capacity).toBe(4);
    expect(readColorlessRecovery(actor, 'enc')).toBeNull();
  });

  it('keeps two characters independent', async () => {
    const ada = makeActor('ada-2');
    const bob = makeActor('bob');
    const adaStones = await syncColorlessStoneLedger(ada);
    ada.system.stonePools.colorless.max = 1;
    ada.system.stonePools.colorless.current = 0;
    const picked = (await syncColorlessStoneLedger(ada))[0]!;
    await commitColorlessRecovery({ actor: ada, combatant: {}, rank: 1, selectedIds: [picked.id], combat });
    expect(readColorlessRecovery(bob, 'enc')).toBeNull();
    expect(bob.system.stonePools.influence.current).toBe(20);
    expect(readColorlessRecovery(ada, 'enc')?.selectedIds).toEqual([picked.id]);
    void adaStones;
  });
});
