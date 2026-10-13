import { describe, expect, it } from 'vitest';
import {
  COMBAT_SNAPSHOT_KIND,
  COMBAT_SNAPSHOT_SCHEMA_VERSION,
  applyCombatSnapshot,
  captureCombatSnapshot,
  matchSnapshotCombatant,
  remapCombatIdsInValue,
  validateCombatSnapshot,
  type CombatSnapshot,
  type CombatSnapshotCombatant,
} from '../src/combat/combat-snapshot';

function makeActor(id: string, name: string, extras: Record<string, unknown> = {}) {
  return {
    id,
    name,
    uuid: `Actor.${id}`,
    type: 'character',
    isToken: false,
    system: {
      health: { bars: [{ value: 10, max: 10 }], currentBar: 0, tempHP: 2 },
      stonePools: { might: { current: 3, max: 6 } },
    },
    flags: {
      'mastery-system': {
        roundState: { combatId: 'combat-old', round: 2, attacks: { used: 1, total: 1 } },
        stoneCombatReady: { combatId: 'combat-old', pools: { might: 3 } },
        spellZones: [{ combatId: 'combat-old', id: 'z1' }],
      },
    },
    getFlag(scope: string, key: string) {
      return (this.flags as any)?.[scope]?.[key];
    },
    effects: [],
    ...extras,
  };
}

function makeCombatant(opts: {
  id: string;
  actor: any;
  tokenId: string;
  initiative?: number;
}) {
  const token = {
    id: opts.tokenId,
    uuid: `Scene.s1.Token.${opts.tokenId}`,
    x: 100,
    y: 200,
    actorLink: true,
    actorId: opts.actor.id,
    actor: opts.actor,
    flags: { 'mastery-system': { statusJson: '[]' } },
    getFlag(scope: string, key: string) {
      return (this.flags as any)?.[scope]?.[key];
    },
  };
  return {
    id: opts.id,
    name: opts.actor.name,
    actorId: opts.actor.id,
    tokenId: opts.tokenId,
    initiative: opts.initiative ?? 12,
    defeated: false,
    hidden: false,
    actor: opts.actor,
    token,
    flags: { 'mastery-system': { msInitiativeValue: opts.initiative ?? 12 } },
    getFlag(scope: string, key: string) {
      return (this.flags as any)?.[scope]?.[key];
    },
  };
}

describe('validateCombatSnapshot', () => {
  it('accepts a well-formed snapshot', () => {
    const snap: CombatSnapshot = {
      exportKind: COMBAT_SNAPSHOT_KIND,
      schemaVersion: COMBAT_SNAPSHOT_SCHEMA_VERSION,
      exportedAt: '2026-10-13T00:00:00.000Z',
      scene: { id: 's1' },
      combat: {
        id: 'c1',
        started: true,
        round: 2,
        turn: 0,
        flags: {},
        combatants: [],
      },
    };
    const r = validateCombatSnapshot(snap);
    expect(r.ok).toBe(true);
  });

  it('rejects wrong kind / missing scene', () => {
    expect(validateCombatSnapshot({ exportKind: 'nope', schemaVersion: 1, scene: { id: 's' }, combat: { combatants: [] } }).ok).toBe(false);
    expect(
      validateCombatSnapshot({
        exportKind: COMBAT_SNAPSHOT_KIND,
        schemaVersion: 1,
        combat: { combatants: [] },
      }).ok,
    ).toBe(false);
  });
});

describe('remapCombatIdsInValue', () => {
  it('rewrites combatId fields and equal string ids', () => {
    const input = {
      combatId: 'combat-old',
      nested: { combatId: 'combat-old', other: 'keep' },
      list: [{ combatId: 'combat-old' }, 'combat-old'],
    };
    const out = remapCombatIdsInValue(input, 'combat-old', 'combat-new') as any;
    expect(out.combatId).toBe('combat-new');
    expect(out.nested.combatId).toBe('combat-new');
    expect(out.nested.other).toBe('keep');
    expect(out.list[0].combatId).toBe('combat-new');
    expect(out.list[1]).toBe('combat-new');
  });

  it('no-ops when ids match', () => {
    const v = { combatId: 'same' };
    expect(remapCombatIdsInValue(v, 'same', 'same')).toBe(v);
  });
});

describe('matchSnapshotCombatant', () => {
  it('matches by tokenUuid then tokenId', () => {
    const actor = makeActor('a1', 'Hero');
    const c = makeCombatant({ id: 'c1', actor, tokenId: 't1', initiative: 15 });
    const snap: CombatSnapshotCombatant = {
      id: 'old',
      name: 'Hero',
      actorId: 'a1',
      tokenId: 't1',
      tokenUuid: 'Scene.s1.Token.t1',
      actorLink: true,
      initiative: 15,
      defeated: false,
      hidden: false,
      flags: {},
      economyOwner: { kind: 'world', actorId: 'a1', actorUuid: 'Actor.a1' },
      actor: { system: {}, flags: {}, activeBuffEffects: [], statusEffects: [] },
      token: { flags: {} },
    };
    expect(matchSnapshotCombatant(snap, [c])?.id).toBe('c1');
    expect(matchSnapshotCombatant({ ...snap, tokenUuid: undefined }, [c])?.id).toBe('c1');
  });
});

describe('applyCombatSnapshot', () => {
  it('rejects scene mismatch', async () => {
    const snap: CombatSnapshot = {
      exportKind: COMBAT_SNAPSHOT_KIND,
      schemaVersion: 1,
      exportedAt: '2026-10-13T00:00:00.000Z',
      scene: { id: 'scene-a' },
      combat: { id: 'c1', started: true, round: 1, turn: 0, flags: {}, combatants: [] },
    };
    const result = await applyCombatSnapshot({ id: 'c2', sceneId: 'scene-b', combatants: [] }, snap);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Scene mismatch/);
  });
});

describe('captureCombatSnapshot', () => {
  it('captures exportKind, initiative order fields, and actor combat flags', () => {
    (globalThis as any).game = {
      world: { id: 'w1' },
      scenes: { get: () => ({ id: 's1', name: 'Arena' }) },
      combat: null,
    };
    const actor = makeActor('a1', 'Hero');
    const c1 = makeCombatant({ id: 'c1', actor, tokenId: 't1', initiative: 18 });
    const combat = {
      id: 'combat-old',
      name: 'Fight',
      started: true,
      round: 3,
      turn: 1,
      scene: { id: 's1' },
      sceneId: 's1',
      combatants: [c1],
      flags: {
        'mastery-system': {
          stonePowersState: { stonesDone: { c1: 3 } },
        },
      },
      getFlag(scope: string, key: string) {
        return (this.flags as any)?.[scope]?.[key];
      },
    };

    const snap = captureCombatSnapshot(combat);
    expect(snap.exportKind).toBe(COMBAT_SNAPSHOT_KIND);
    expect(snap.schemaVersion).toBe(COMBAT_SNAPSHOT_SCHEMA_VERSION);
    expect(snap.scene.id).toBe('s1');
    expect(snap.combat.round).toBe(3);
    expect(snap.combat.turn).toBe(1);
    expect(snap.combat.combatants).toHaveLength(1);
    expect(snap.combat.combatants[0]!.initiative).toBe(18);
    expect((snap.combat.combatants[0]!.actor.flags.roundState as any).combatId).toBe('combat-old');
    expect(snap.combat.flags.stonePowersState).toBeTruthy();
  });
});
