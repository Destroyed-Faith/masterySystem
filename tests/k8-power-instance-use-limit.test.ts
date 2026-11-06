/**
 * K8 — Power Use Limit tracks independently acquired/granted Power instances,
 * not Technical Reference alone. Learned Hex + Artifact Hex may each be used
 * once per Round. Global Limited charges still bind across instances.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canonicalPowerUseInstanceId,
  getRoundState,
  hasPowerBeenUsedThisRound,
  markPowerUsedThisRound,
  powerUseIdentity,
  powerUseInstanceIdFromOption,
  resetRoundState,
  setRoundState,
} from '../src/combat/action-economy.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import {
  LIMITED_CHARGE_FLAG,
  isLimitedChargeAvailable,
  spendLimitedCharge,
} from '../src/combat/limited-charge.js';

function makeActor(id: string, items: any[] = []) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  const byId = new Map(items.map((it) => [String(it.id), it]));
  return {
    id,
    name: id,
    type: 'character',
    items: {
      get: (itemId: string) => byId.get(String(itemId)),
      values: () => items.values(),
      [Symbol.iterator]: () => items[Symbol.iterator](),
    },
    flags,
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (this.flags[scope]) delete this.flags[scope][key];
    },
    async update(data: Record<string, unknown>) {
      if (data['flags.mastery-system.-=roundState'] != null) {
        delete this.flags['mastery-system']?.roundState;
      }
    },
  };
}

describe('K8 independent Power instances (once-per-Round)', () => {
  const combat = { id: 'c1', round: 1, turn: 0 } as any;

  beforeEach(() => {
    (globalThis as any).Hooks = { callAll: vi.fn() };
    (globalThis as any).ui = { notifications: { warn: vi.fn(), info: vi.fn() } };
    (globalThis as any).canvas = { tokens: { placeables: [] } };
    (globalThis as any).game = {
      user: { isGM: true },
      combat,
      actors: { get: () => null },
    };
  });

  it('identity prefers learned item id and stable artifact grant keys', () => {
    const learned = {
      id: 'learned-hex',
      type: 'power',
      name: 'Ranged Hex',
      system: { templateId: 'active-ranged-hex' },
    };
    const actor = makeActor('a1', [learned]) as any;
    expect(powerUseIdentity(actor, 'learned-hex')).toBe('learned-hex');
    expect(powerUseIdentity(actor, 'artifact:staff1:slot:0')).toBe('artifact:staff1:slot:0');
    expect(powerUseInstanceIdFromOption({ id: 'artifact:staff1:slot:1', item: { id: 'staff1' } })).toBe(
      'artifact:staff1:slot:1',
    );
    expect(
      powerUseInstanceIdFromOption({
        id: 'radial-row',
        item: { id: 'learned-hex' },
      }),
    ).toBe('learned-hex');
  });

  it('learned Hex and Artifact Hex are independent once-per-Round uses', async () => {
    const learned = {
      id: 'learned-hex',
      type: 'power',
      name: 'Ranged Hex',
      system: { templateId: 'active-ranged-hex' },
    };
    const staff = {
      id: 'staff1',
      type: 'artifact',
      name: 'Staff of Hexes',
      system: { currentLevel: 3 },
    };
    const actor = makeActor('a1', [learned, staff]) as any;
    const artKey = 'artifact:staff1:slot:0';

    await markPowerUsedThisRound(actor, combat, 'learned-hex');
    expect(hasPowerBeenUsedThisRound(actor, combat, 'learned-hex')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, artKey)).toBe(false);

    await markPowerUsedThisRound(actor, combat, artKey);
    expect(hasPowerBeenUsedThisRound(actor, combat, artKey)).toBe(true);

    const used = getRoundState(actor, combat).usedPowerIdsThisRound ?? [];
    expect(used).toEqual(expect.arrayContaining(['learned-hex', artKey]));
    expect(used).toHaveLength(2);
  });

  it('two Artifact grants on separate items stay independent', async () => {
    const actor = makeActor('a1') as any;
    const a = 'artifact:staff-a:slot:0';
    const b = 'artifact:staff-b:slot:0';
    await markPowerUsedThisRound(actor, combat, a);
    expect(hasPowerBeenUsedThisRound(actor, combat, a)).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, b)).toBe(false);
    await markPowerUsedThisRound(actor, combat, b);
    expect(hasPowerBeenUsedThisRound(actor, combat, b)).toBe(true);
  });

  it('slot upgrades keep one instance key (rename/PL change does not mint another)', async () => {
    const actor = makeActor('a1') as any;
    const slotKey = 'artifact:staff1:slot:1';
    await markPowerUsedThisRound(actor, combat, slotKey);
    // Same slot after "upgrade" / rename still blocked; different slot free.
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:1')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:2')).toBe(false);
  });

  it('persists across save/reload of roundState flags', async () => {
    const actor = makeActor('a1') as any;
    await markPowerUsedThisRound(actor, combat, 'learned-hex');
    await markPowerUsedThisRound(actor, combat, 'artifact:staff1:slot:0');

    // Simulate reload: read from persisted flags only.
    const reloaded = makeActor('a1') as any;
    reloaded.flags = JSON.parse(JSON.stringify(actor.flags));
    expect(hasPowerBeenUsedThisRound(reloaded, combat, 'learned-hex')).toBe(true);
    expect(hasPowerBeenUsedThisRound(reloaded, combat, 'artifact:staff1:slot:0')).toBe(true);
  });

  it('round reset clears instance usage', async () => {
    const actor = makeActor('a1') as any;
    await markPowerUsedThisRound(actor, combat, 'learned-hex');
    await markPowerUsedThisRound(actor, combat, 'artifact:staff1:slot:0');
    expect((getRoundState(actor, combat).usedPowerIdsThisRound ?? []).length).toBe(2);

    const combatant = { getFlag: () => undefined } as any;
    await resetRoundState(actor as any, combatant, { ...combat, round: 2 } as any);
    const next = getRoundState(actor, { ...combat, round: 2 } as any);
    expect(next.usedPowerIdsThisRound ?? []).toEqual([]);
    expect(hasPowerBeenUsedThisRound(actor, { ...combat, round: 2 } as any, 'learned-hex')).toBe(
      false,
    );
  });

  it('global Limited charge still binds across learned and Artifact instances', async () => {
    const actor = makeActor('a1') as any;
    expect(isLimitedChargeAvailable(actor as any)).toBe(true);
    await spendLimitedCharge(actor as any);
    expect(isLimitedChargeAvailable(actor as any)).toBe(false);
    expect(actor.getFlag('mastery-system', LIMITED_CHARGE_FLAG)).toBe(true);

    // Instance keys remain independently markable; the charge is the shared gate.
    await markPowerUsedThisRound(actor, combat, 'learned-limited');
    await markPowerUsedThisRound(actor, combat, 'artifact:staff1:slot:0');
    expect(hasPowerBeenUsedThisRound(actor, combat, 'learned-limited')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:0')).toBe(true);
    expect(isLimitedChargeAvailable(actor as any)).toBe(false);
  });

  it('setRoundState replace keeps distinct instance keys (no merge collapse)', async () => {
    const actor = makeActor('a1') as any;
    await setRoundState(actor as any, {
      ...getRoundState(actor as any, combat),
      combatId: 'c1',
      round: 1,
      usedPowerIdsThisRound: ['learned-hex', 'artifact:staff1:slot:0'],
    });
    await setRoundState(actor as any, {
      ...getRoundState(actor as any, combat),
      combatId: 'c1',
      round: 1,
      usedPowerIdsThisRound: ['artifact:staff1:slot:1'],
    });
    expect(getRoundState(actor as any, combat).usedPowerIdsThisRound).toEqual([
      'artifact:staff1:slot:1',
    ]);
  });

  it('Breath mode suffixes share one instance; Damage use hides Ruin too', async () => {
    expect(canonicalPowerUseInstanceId('artifact:staff1:slot:0:damage')).toBe(
      'artifact:staff1:slot:0',
    );
    const actor = makeActor('a1') as any;
    await markPowerUsedThisRound(actor, combat, 'artifact:staff1:slot:0:damage');
    expect(getRoundState(actor, combat).usedPowerIdsThisRound).toEqual([
      'artifact:staff1:slot:0',
    ]);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:0:ruin')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:1')).toBe(false);
  });

  it('legacy whole-artifact mark still blocks every grant on that item', async () => {
    const actor = makeActor('a1') as any;
    await markPowerUsedThisRound(actor, combat, 'staff1');
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:0')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:staff1:slot:2')).toBe(true);
    expect(hasPowerBeenUsedThisRound(actor, combat, 'artifact:other:slot:0')).toBe(false);
  });

  it('radial artifact options omit spent grants (no click-to-fail leftovers)', async () => {
    const staff = {
      id: 'staff1',
      type: 'artifact',
      name: 'Staff of Hexes',
      getFlag: () => true,
      system: {
        equipped: true,
        binding: 'bound',
        artifactKind: 'implement',
        currentLevel: 1,
        level: 1,
        levelProgression: [
          {
            level: 1,
            name: 'Ranged Hex',
            type: 'Active',
            powerTemplateId: 'active-ranged-hex',
            range: '20 m',
          },
        ],
      },
    };
    const actor = makeActor('a1', [staff]) as any;
    const before = buildArtifactRadialOptions(actor);
    expect(before.some((o) => o.id === 'artifact:staff1:slot:0')).toBe(true);

    await markPowerUsedThisRound(actor, combat, 'artifact:staff1:slot:0');

    const after = buildArtifactRadialOptions(actor).filter((opt) => {
      const usageId = powerUseInstanceIdFromOption(opt);
      if (usageId && hasPowerBeenUsedThisRound(actor, combat, usageId)) return false;
      const itemId = String(opt.item?.id || '').trim();
      if (itemId && hasPowerBeenUsedThisRound(actor, combat, itemId)) return false;
      return true;
    });
    expect(after.some((o) => o.id === 'artifact:staff1:slot:0')).toBe(false);
  });
});
