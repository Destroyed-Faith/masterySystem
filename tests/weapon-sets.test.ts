import { beforeEach, describe, expect, it, vi } from 'vitest';

const movement = { used: 0, total: 1 };
const consumeMovementAction = vi.fn(async () => {
  if (movement.used >= movement.total) return false;
  movement.used += 1;
  return true;
});
const refundMovementAction = vi.fn(async () => {
  if (movement.used > 0) movement.used -= 1;
});

vi.mock('../src/combat/action-economy.js', () => ({
  consumeMovementAction: (...args: unknown[]) => consumeMovementAction(...args),
  refundMovementAction: (...args: unknown[]) => refundMovementAction(...args),
  getAvailableMovementActions: () => Math.max(0, movement.total - movement.used),
  isNormalMovementReplaced: () => false,
  getActionEconomyActor: (actor: unknown) => actor,
}));

vi.mock('../src/combat/combat-permissions.js', () => ({
  canCurrentUserUpdateDocument: () => true,
}));

vi.mock('../src/utils/consumable-slots.js', () => ({
  actorParticipatesInActiveCombat: (actor: { id?: string }) => {
    const combat = (globalThis as any).game?.combat;
    if (!combat?.active) return false;
    return !!(combat.combatants as any[])?.some((c: any) => String(c.actorId || c.actor?.id) === String(actor?.id));
  },
}));

import { COMBAT_MANEUVERS, getAvailableManeuvers } from '../src/system/combat-maneuvers.js';
import { RADIAL_STANDARD_MANEUVER_IDS } from '../src/utils/radial-maneuver-prefs.js';
import {
  applyWeaponSetHands,
  buildInitialWeaponSets,
  ensureWeaponSets,
  isNaturallyTwoHandedItem,
  peekWeaponSets,
  pruneWeaponSetRefs,
  readHandsFromEquippedItems,
  resetWeaponSetLocks,
  resolveSwapTarget,
  swapWeaponSet,
  WEAPON_SWAP_ID,
} from '../src/utils/weapon-sets.js';

function merge(target: any, source: any): any {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const out = { ...(target && typeof target === 'object' && !Array.isArray(target) ? target : {}) };
  for (const [k, v] of Object.entries(source)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k], v) : v;
  }
  return out;
}

function makeItem(id: string, opts: {
  type?: string;
  equipped?: boolean;
  slot?: string | null;
  hands?: number;
  innates?: string[];
  twoHanded?: boolean;
} = {}) {
  const equipment: Record<string, unknown> = {
    container: 'inventory',
    band: 'not',
    slot: opts.slot ?? null,
  };
  if (opts.twoHanded) equipment.twoHanded = true;
  const flags: Record<string, any> = { 'mastery-system': { equipment } };
  return {
    id,
    type: opts.type ?? 'weapon',
    name: id,
    system: {
      equipped: opts.equipped ?? false,
      hands: opts.hands ?? 1,
      innateAbilities: opts.innates ?? [],
    },
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async update(data: Record<string, unknown>) {
      if (data['system.equipped'] !== undefined) this.system.equipped = data['system.equipped'];
      if (data['flags.mastery-system.equipment']) {
        flags['mastery-system'].equipment = data['flags.mastery-system.equipment'];
      }
    },
  };
}

function makeActor(items: ReturnType<typeof makeItem>[], initialSets?: unknown) {
  const flags: Record<string, any> = {
    'mastery-system': initialSets ? { weaponSets: initialSets } : {},
  };
  const actor = {
    id: 'actor-1',
    uuid: 'Actor.actor-1',
    type: 'character',
    items,
    flags,
    sheet: { render: vi.fn() },
    prepareDerivedData: vi.fn(),
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      if (!flags[scope]) flags[scope] = {};
      flags[scope][key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(flags[scope][key], value)
        : value;
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
    async update(data: Record<string, unknown>) {
      if (data['flags.mastery-system.weaponSets']) {
        if (!flags['mastery-system']) flags['mastery-system'] = {};
        flags['mastery-system'].weaponSets = data['flags.mastery-system.weaponSets'];
      }
    },
    async updateEmbeddedDocuments(_type: string, updates: Array<Record<string, unknown>>) {
      for (const upd of updates) {
        const item = items.find((it) => it.id === upd._id);
        if (item) await item.update(upd);
      }
    },
  };
  return actor;
}

describe('weapon set model helpers', () => {
  it('migrates current hands into set 1 and leaves set 2 empty', () => {
    const state = buildInitialWeaponSets({ mainhand: 'sword', offhand: 'shield' });
    expect(state.active).toBe(1);
    expect(state.sets[1]).toEqual({ mainhand: 'sword', offhand: 'shield' });
    expect(state.sets[2]).toEqual({ mainhand: null, offhand: null });
  });

  it('is idempotent: already-initialized state is not rebuilt from hands', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const actor = makeActor([sword], {
      schemaVersion: 1,
      active: 2,
      sets: {
        1: { mainhand: 'sword', offhand: 'shield' },
        2: { mainhand: null, offhand: null },
      },
    });
    const state = await ensureWeaponSets(actor);
    expect(state.active).toBe(2);
    expect(state.sets[1].offhand).toBe(null);
    expect(state.sets[1].mainhand).toBe('sword');
  });

  it('prunes deleted item ids from both sets', () => {
    const pruned = pruneWeaponSetRefs(
      {
        schemaVersion: 1,
        active: 1,
        sets: {
          1: { mainhand: 'sword', offhand: 'gone' },
          2: { mainhand: 'bow', offhand: 'bow' },
        },
      },
      new Set(['sword']),
    );
    expect(pruned.sets[1]).toEqual({ mainhand: 'sword', offhand: null });
    expect(pruned.sets[2]).toEqual({ mainhand: null, offhand: null });
  });

  it('treats a 2H item as occupying both hand references', () => {
    const bow = makeItem('bow', { type: 'weapon', equipped: true, slot: 'mainhand', hands: 2 });
    const actor = makeActor([bow]);
    expect(isNaturallyTwoHandedItem(bow)).toBe(true);
    expect(readHandsFromEquippedItems(actor)).toEqual({ mainhand: 'bow', offhand: 'bow' });
  });

  it('resolveSwapTarget no-ops on the already active set and toggles otherwise', () => {
    expect(resolveSwapTarget(1, 1)).toBeNull();
    expect(resolveSwapTarget(2, 2)).toBeNull();
    expect(resolveSwapTarget(1)).toBe(2);
    expect(resolveSwapTarget(2)).toBe(1);
    expect(resolveSwapTarget(1, 2)).toBe(2);
  });
});

describe('weapon set apply + swap', () => {
  beforeEach(() => {
    resetWeaponSetLocks();
    movement.used = 0;
    movement.total = 1;
    consumeMovementAction.mockClear();
    refundMovementAction.mockClear();
    (globalThis as any).game = {
      user: { isGM: true },
      combat: null,
      i18n: { localize: (k: string) => k },
    };
    (globalThis as any).ui = { notifications: { warn: vi.fn(), info: vi.fn() } };
    (globalThis as any).Hooks = { callAll: vi.fn() };
  });

  it('initializes an existing character from current hand occupancy', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const shield = makeItem('shield', { type: 'shield', equipped: true, slot: 'offhand' });
    const actor = makeActor([sword, shield]);
    const state = await ensureWeaponSets(actor);
    expect(state.active).toBe(1);
    expect(state.sets[1]).toEqual({ mainhand: 'sword', offhand: 'shield' });
    expect(state.sets[2]).toEqual({ mainhand: null, offhand: null });
  });

  it('can store independent sets including 1H sword+shield and 2H bow', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const shield = makeItem('shield', { type: 'shield', equipped: true, slot: 'offhand' });
    const bow = makeItem('bow', { type: 'weapon', equipped: false, slot: null, hands: 2 });
    const actor = makeActor([sword, shield, bow], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: 'shield' },
        2: { mainhand: 'bow', offhand: 'bow' },
      },
    });
    const result = await swapWeaponSet(actor);
    expect(result).toMatchObject({ ok: true, swapped: true, active: 2, spentMovement: false });
    expect(sword.system.equipped).toBe(false);
    expect(shield.system.equipped).toBe(false);
    expect(bow.system.equipped).toBe(true);
    expect(bow.getFlag('mastery-system', 'equipment').slot).toBe('mainhand');
    expect(bow.getFlag('mastery-system', 'equipment').twoHanded).toBe(true);
  });

  it('can reference the same sword 1H in set 1 and 2H in set 2 without duplicating the item', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand', innates: ['Versatile'] });
    const shield = makeItem('shield', { type: 'shield', equipped: true, slot: 'offhand' });
    const actor = makeActor([sword, shield], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: 'shield' },
        2: { mainhand: 'sword', offhand: 'sword' },
      },
    });
    await swapWeaponSet(actor, 2);
    expect(sword.system.equipped).toBe(true);
    expect(shield.system.equipped).toBe(false);
    expect(sword.getFlag('mastery-system', 'equipment').twoHanded).toBe(true);
    expect(actor.items.filter((it) => it.id === 'sword')).toHaveLength(1);
  });

  it('Weapon Swap toggles 1 → 2 and 2 → 1', async () => {
    const a = makeItem('a', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const b = makeItem('b', { type: 'weapon', equipped: false, slot: null });
    const actor = makeActor([a, b], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'a', offhand: null },
        2: { mainhand: 'b', offhand: null },
      },
    });
    expect((await swapWeaponSet(actor)).active).toBe(2);
    expect((await swapWeaponSet(actor)).active).toBe(1);
    expect(peekWeaponSets(actor).active).toBe(1);
  });

  it('clicking the already active set does not swap or spend', async () => {
    (globalThis as any).game.combat = { active: true, combatants: [{ actorId: 'actor-1' }] };
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const actor = makeActor([sword], {
      schemaVersion: 1,
      active: 1,
      sets: { 1: { mainhand: 'sword', offhand: null }, 2: { mainhand: null, offhand: null } },
    });
    const result = await swapWeaponSet(actor, 1);
    expect(result).toEqual({ ok: true, swapped: false, active: 1 });
    expect(consumeMovementAction).not.toHaveBeenCalled();
    expect(movement.used).toBe(0);
  });

  it('is free out of combat and spends exactly one movement action in combat', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const actor = makeActor([sword], {
      schemaVersion: 1,
      active: 1,
      sets: { 1: { mainhand: 'sword', offhand: null }, 2: { mainhand: null, offhand: null } },
    });
    const out = await swapWeaponSet(actor);
    expect(out).toMatchObject({ ok: true, spentMovement: false, active: 2 });
    expect(consumeMovementAction).not.toHaveBeenCalled();

    (globalThis as any).game.combat = { active: true, combatants: [{ actorId: 'actor-1' }] };
    const back = await swapWeaponSet(actor);
    expect(back).toMatchObject({ ok: true, spentMovement: true, active: 1 });
    expect(consumeMovementAction).toHaveBeenCalledTimes(1);
    expect(movement.used).toBe(1);
  });

  it('blocks the swap when no movement remains and leaves the active set unchanged', async () => {
    movement.used = 1;
    (globalThis as any).game.combat = { active: true, combatants: [{ actorId: 'actor-1' }] };
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const bow = makeItem('bow', { type: 'weapon', equipped: false, slot: null, hands: 2 });
    const actor = makeActor([sword, bow], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: null },
        2: { mainhand: 'bow', offhand: 'bow' },
      },
    });
    const result = await swapWeaponSet(actor);
    expect(result).toEqual({ ok: false, reason: 'no-movement' });
    expect(peekWeaponSets(actor).active).toBe(1);
    expect(sword.system.equipped).toBe(true);
    expect(bow.system.equipped).toBe(false);
    expect((globalThis as any).ui.notifications.warn).toHaveBeenCalled();
  });

  it('allows swapping onto a fully empty set and clears previous hand effects', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const shield = makeItem('shield', { type: 'shield', equipped: true, slot: 'offhand' });
    const actor = makeActor([sword, shield], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: 'shield' },
        2: { mainhand: null, offhand: null },
      },
    });
    await swapWeaponSet(actor, 2);
    expect(sword.system.equipped).toBe(false);
    expect(shield.system.equipped).toBe(false);
    expect(sword.getFlag('mastery-system', 'equipment').slot).toBeNull();
    expect(shield.getFlag('mastery-system', 'equipment').slot).toBeNull();
    expect(sword.getFlag('mastery-system', 'equipment').weaponSetPrepared).toBe(true);
    expect(shield.getFlag('mastery-system', 'equipment').weaponSetPrepared).toBe(true);
    expect(peekWeaponSets(actor).sets[1]).toEqual({ mainhand: 'sword', offhand: 'shield' });
  });

  it('keeps the inactive set prepared instead of sending it to inventory', async () => {
    const { occupiesInventoryGrid } = await import('../src/utils/inventory-grid.js');
    const { isHiddenInInactiveWeaponSet } = await import('../src/utils/weapon-sets.js');
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const bow = makeItem('bow', { type: 'weapon', equipped: false, slot: null, hands: 2 });
    const actor = makeActor([sword, bow], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: null },
        2: { mainhand: 'bow', offhand: 'bow' },
      },
    });
    await swapWeaponSet(actor, 2);
    expect(isHiddenInInactiveWeaponSet(actor, sword)).toBe(true);
    expect(occupiesInventoryGrid(sword.getFlag('mastery-system', 'equipment'))).toBe(false);
    expect(sword.system.equipped).toBe(false);
    expect(bow.system.equipped).toBe(true);
    expect(peekWeaponSets(actor).sets[1].mainhand).toBe('sword');
  });

  it('rapid clicks while a swap is in progress do not start a second apply', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const actor = makeActor([sword], {
      schemaVersion: 1,
      active: 1,
      sets: { 1: { mainhand: 'sword', offhand: null }, 2: { mainhand: null, offhand: null } },
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = actor.updateEmbeddedDocuments.bind(actor);
    actor.updateEmbeddedDocuments = async (...args: any[]) => {
      await gate;
      return original(...args);
    };
    const first = swapWeaponSet(actor);
    const second = await swapWeaponSet(actor);
    expect(second).toEqual({ ok: false, reason: 'busy' });
    release();
    const done = await first;
    expect(done).toMatchObject({ ok: true, swapped: true, active: 2 });
  });
});

describe('Weapon Swap movement action catalog', () => {
  it('is a general movement action and appears with the other standard movement maneuvers', () => {
    const maneuver = COMBAT_MANEUVERS.find((m) => m.id === WEAPON_SWAP_ID);
    expect(maneuver).toMatchObject({ id: 'weapon-swap', name: 'Weapon Swap', slot: 'movement' });
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('weapon-swap');
    const available = getAvailableManeuvers({
      system: {},
      items: [],
      getFlag: () => undefined,
    });
    expect(available.some((m) => m.id === 'weapon-swap')).toBe(true);
    expect(available.some((m) => m.slot === 'movement' && m.id === 'move')).toBe(true);
  });
});

describe('applyWeaponSetHands dual-wield / two-item sets', () => {
  it('keeps two different one-handed items equipped inside one set', async () => {
    const left = makeItem('left', { type: 'weapon', equipped: false, slot: null });
    const right = makeItem('right', { type: 'shield', equipped: false, slot: null });
    const actor = makeActor([left, right]);
    await applyWeaponSetHands(actor, { mainhand: 'left', offhand: 'right' });
    expect(left.system.equipped).toBe(true);
    expect(right.system.equipped).toBe(true);
    expect(left.getFlag('mastery-system', 'equipment').slot).toBe('mainhand');
    expect(right.getFlag('mastery-system', 'equipment').slot).toBe('offhand');
  });
});
