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

vi.mock('../src/combat/action-economy.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/combat/action-economy.js')>();
  return {
    ...actual,
    consumeMovementAction: (...args: unknown[]) => consumeMovementAction(...args),
    refundMovementAction: (...args: unknown[]) => refundMovementAction(...args),
    getAvailableMovementActions: () => Math.max(0, movement.total - movement.used),
    isNormalMovementReplaced: () => false,
    getActionEconomyActor: (actor: unknown) => actor,
  };
});

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
import { buildWeaponSwapCardHtml } from '../src/chat/weapon-swap-card.js';
import {
  addWeaponSetSlot,
  activeWeaponSetNeedsEquipmentSync,
  describeWeaponSetHands,
  describeWeaponSwap,
  describeActiveWeaponProfile,
  applyWeaponSetHands,
  buildInitialWeaponSets,
  ensureWeaponSets,
  isNaturallyTwoHandedItem,
  listEquipmentWeaponSetChoices,
  listWeaponSwapChoices,
  peekWeaponSets,
  pruneWeaponSetRefs,
  readHandsFromEquippedItems,
  reconcileActiveWeaponSetEquipment,
  resetWeaponSetLocks,
  resolveSwapTarget,
  swapWeaponSet,
  weaponSetCount,
  WEAPON_SWAP_ID,
} from '../src/utils/weapon-sets.js';
import {
  resolveEquippedWeaponForAttackType,
} from '../src/utils/unarmed-fallback.js';
import { resolveEquippedWeaponDamageFormula } from '../src/combat/parry.js';

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
  name?: string;
  baseProfile?: string;
  currentLevel?: number;
  artifactWeapon?: Record<string, unknown>;
  damage?: string;
} = {}) {
  const equipment: Record<string, unknown> = {
    container: 'inventory',
    band: 'not',
    slot: opts.slot ?? null,
  };
  if (opts.twoHanded) equipment.twoHanded = true;
  const flags: Record<string, any> = { 'mastery-system': { equipment } };
  const system: Record<string, unknown> = {
    equipped: opts.equipped ?? false,
    hands: opts.hands ?? 1,
    innateAbilities: opts.innates ?? [],
  };
  if (opts.baseProfile) system.baseProfile = opts.baseProfile;
  if (opts.currentLevel != null) system.currentLevel = opts.currentLevel;
  if (opts.artifactWeapon) system.artifactWeapon = opts.artifactWeapon;
  if (opts.damage) system.damage = opts.damage;
  return {
    id,
    type: opts.type ?? 'weapon',
    name: opts.name ?? id,
    system,
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

/** Lor-Keth-style two-handed Artifact sitting in inventory but assigned to Set 1. */
function makeUnequippedTwoHandedStaff(id = 'lSqKokGmDKKkzyNX') {
  return makeItem(id, {
    type: 'artifact',
    name: "Lor-Keth's Staff - Level 3-1",
    equipped: false,
    slot: null,
    hands: 2,
    baseProfile: 'twoHandedWeapon',
    currentLevel: 3,
    artifactWeapon: { damage: '7d8', weaponType: 'melee', hands: 2, specials: [] },
  });
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

  it('is free out of combat and in combat (no Movement spend)', async () => {
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
    expect(back).toMatchObject({ ok: true, spentMovement: false, active: 1 });
    expect(consumeMovementAction).not.toHaveBeenCalled();
    expect(movement.used).toBe(0);
  });

  it('still swaps in combat when no Movement remains', async () => {
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
    expect(result).toMatchObject({ ok: true, swapped: true, active: 2, spentMovement: false });
    expect(peekWeaponSets(actor).active).toBe(2);
    expect(sword.system.equipped).toBe(false);
    expect(bow.system.equipped).toBe(true);
    expect(consumeMovementAction).not.toHaveBeenCalled();
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

describe('Weapon Swap action catalog', () => {
  it('is a Movement action and still appears as a standard radial maneuver', () => {
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

describe('weapon set labels', () => {
  it('names the active weapon and the set Weapon Swap will switch to', () => {
    const bow = makeItem('bow', { type: 'weapon', equipped: true, slot: 'mainhand' });
    bow.name = 'Heartseeker';
    const actor = makeActor([bow], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'bow', offhand: 'bow' },
        2: { mainhand: null, offhand: null },
      },
    });
    expect(describeWeaponSetHands(actor, { mainhand: 'bow', offhand: 'bow' })).toBe(
      'Heartseeker (both hands)',
    );
    expect(describeWeaponSetHands(actor, { mainhand: null, offhand: null })).toBe('empty');
    const swap = describeWeaponSwap(actor);
    expect(swap.active).toBe(1);
    expect(swap.next).toBe(2);
    expect(swap.from).toContain('Heartseeker');
    expect(swap.to).toBe('empty');
    expect(describeActiveWeaponProfile(actor).name).toBe('Heartseeker');
    expect(describeActiveWeaponProfile(actor).unarmed).toBe(false);
  });

  it('lists the worn set, the other set, and Unarmed, and stowing keeps both sets', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    sword.name = 'Sword';
    const bow = makeItem('bow', { type: 'weapon', equipped: false, slot: null });
    bow.name = 'Bow';
    const actor = makeActor([sword, bow], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: null },
        2: { mainhand: 'bow', offhand: null },
      },
    });
    const choices = listWeaponSwapChoices(actor);
    expect(choices.map((choice) => choice.target)).toEqual([1, 2, 'unarmed']);
    expect(choices[0].active).toBe(true);
    expect(choices[0].name).toContain('Sword');
    expect(choices[1].name).toContain('Bow');
    expect(choices[2].active).toBe(false);
    expect(choices[2].name).toBe('Fists');

    const emptySecond = makeActor([sword], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'sword', offhand: null },
        2: { mainhand: null, offhand: null },
      },
    });
    expect(listWeaponSwapChoices(emptySecond).map((choice) => choice.target)).toEqual([1, 2, 'unarmed']);
    expect(listEquipmentWeaponSetChoices(emptySecond).map((choice) => choice.target)).toEqual([1, 2]);
    expect(listEquipmentWeaponSetChoices(actor).map((choice) => choice.target)).toEqual([1, 2]);

    const stowed = await swapWeaponSet(actor, 'unarmed');
    expect(stowed).toMatchObject({ ok: true, swapped: true, active: 1 });
    expect(sword.system.equipped).toBe(false);
    expect(peekWeaponSets(actor).stowed).toBe(true);
    expect(peekWeaponSets(actor).sets[1].mainhand).toBe('sword');
    expect(peekWeaponSets(actor).sets[2].mainhand).toBe('bow');
    expect(describeActiveWeaponProfile(actor).unarmed).toBe(true);
    expect(listWeaponSwapChoices(actor)[0].target).toBe('unarmed');

    const html = buildWeaponSwapCardHtml(actor);
    expect(html.match(/data-action="weapon-swap-pick"/g)).toHaveLength(2);
    expect(html).toContain('data-target="1"');
    expect(html).toContain('data-target="2"');
    expect(html).not.toContain('data-target="unarmed"');
    expect(html).toContain('disabled');

    const back = await swapWeaponSet(actor, 2);
    expect(back).toMatchObject({ ok: true, swapped: true, active: 2 });
    expect(peekWeaponSets(actor).stowed).toBe(false);
    expect(bow.system.equipped).toBe(true);
    expect(sword.system.equipped).toBe(false);
  });

  it('GM can add a third Weaponslot', async () => {
    const sword = makeItem('sword', { type: 'weapon', equipped: true, slot: 'mainhand' });
    const actor = makeActor([sword], {
      schemaVersion: 1,
      active: 1,
      sets: { 1: { mainhand: 'sword', offhand: null }, 2: { mainhand: null, offhand: null } },
    });
    expect(weaponSetCount(peekWeaponSets(actor))).toBe(2);
    const next = await addWeaponSetSlot(actor);
    expect(next).toBeTruthy();
    expect(weaponSetCount(next!)).toBe(3);
    expect(listEquipmentWeaponSetChoices(actor).map((c) => c.target)).toEqual([1, 2, 3]);
    expect(listEquipmentWeaponSetChoices(actor).map((c) => c.shortLabel)).toEqual(['I', 'II', 'III']);
  });
});

describe('two-handed Artifact in active Weapon Set (Lor-Keth Staff regression)', () => {
  beforeEach(() => {
    resetWeaponSetLocks();
    (globalThis as any).game = { user: { isGM: true } };
  });

  function staffActor(staff = makeUnequippedTwoHandedStaff()) {
    return {
      actor: makeActor([staff], {
        schemaVersion: 1,
        active: 1,
        stowed: false,
        sets: {
          1: { mainhand: staff.id, offhand: staff.id },
          2: { mainhand: null, offhand: null },
        },
      }),
      staff,
    };
  }

  it('detects equipment drift when Set 1 has the Staff but it is unequipped', () => {
    const { actor } = staffActor();
    expect(activeWeaponSetNeedsEquipmentSync(actor)).toBe(true);
  });

  it('resolves melee selection and 7d8 damage from the set without equipped=true', () => {
    const { actor, staff } = staffActor();
    const resolved = resolveEquippedWeaponForAttackType([staff], 'melee', actor);
    expect(resolved?.id).toBe(staff.id);
    expect(resolved?.system?.damage).toBe('7d8');
    expect(describeActiveWeaponProfile(actor)).toMatchObject({
      unarmed: false,
      damage: '7d8',
      name: "Lor-Keth's Staff",
    });
    expect(resolveEquippedWeaponDamageFormula(actor)).toBe('7d8');
  });

  it('ensureWeaponSets / sheet reopen reconciles equipped + mainhand slot', async () => {
    const { actor, staff } = staffActor();
    expect(staff.system.equipped).toBe(false);
    await ensureWeaponSets(actor);
    expect(staff.system.equipped).toBe(true);
    expect(staff.getFlag('mastery-system', 'equipment').slot).toBe('mainhand');
    expect(staff.getFlag('mastery-system', 'equipment').twoHanded).toBe(true);
    expect(activeWeaponSetNeedsEquipmentSync(actor)).toBe(false);
    expect(readHandsFromEquippedItems(actor)).toEqual({
      mainhand: staff.id,
      offhand: staff.id,
    });
  });

  it('clicking the already-active set re-applies the Staff', async () => {
    const { actor, staff } = staffActor();
    const result = await swapWeaponSet(actor, 1);
    expect(result).toMatchObject({ ok: true, swapped: false, active: 1 });
    expect(staff.system.equipped).toBe(true);
    expect(staff.getFlag('mastery-system', 'equipment').slot).toBe('mainhand');
  });

  it('switching Weapon Sets equips set 2 then restores the Staff on set 1', async () => {
    const staff = makeUnequippedTwoHandedStaff();
    const dagger = makeItem('dagger', {
      type: 'weapon',
      name: 'Dagger',
      equipped: false,
      slot: null,
      damage: '1d8',
    });
    const actor = makeActor([staff, dagger], {
      schemaVersion: 1,
      active: 1,
      stowed: false,
      sets: {
        1: { mainhand: staff.id, offhand: staff.id },
        2: { mainhand: 'dagger', offhand: null },
      },
    });
    await reconcileActiveWeaponSetEquipment(actor);
    expect(staff.system.equipped).toBe(true);

    const toTwo = await swapWeaponSet(actor, 2);
    expect(toTwo).toMatchObject({ ok: true, swapped: true, active: 2 });
    expect(dagger.system.equipped).toBe(true);
    expect(staff.system.equipped).toBe(false);
    expect(resolveEquippedWeaponForAttackType([staff, dagger], 'melee', actor)?.id).toBe('dagger');

    const back = await swapWeaponSet(actor, 1);
    expect(back).toMatchObject({ ok: true, swapped: true, active: 1 });
    expect(staff.system.equipped).toBe(true);
    expect(resolveEquippedWeaponForAttackType([staff, dagger], 'melee', actor)?.system?.damage).toBe(
      '7d8',
    );
  });

  it('unlinked token actor keeps its own set; world updates do not rewrite token items', async () => {
    const worldStaff = makeUnequippedTwoHandedStaff('world-staff');
    const world = makeActor([worldStaff], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'world-staff', offhand: 'world-staff' },
        2: { mainhand: null, offhand: null },
      },
    });
    world.id = 'world-lor';

    // Unlinked token: own item copy + own weaponSets (may be stale / unequipped).
    const tokenStaff = makeUnequippedTwoHandedStaff('token-staff');
    tokenStaff.name = "Lor-Keth's Staff - Level 3-1";
    const token = makeActor([tokenStaff], {
      schemaVersion: 1,
      active: 1,
      stowed: false,
      sets: {
        1: { mainhand: 'token-staff', offhand: 'token-staff' },
        2: { mainhand: null, offhand: null },
      },
    });
    token.id = 'token-lor';
    (token as any).isToken = true;

    await ensureWeaponSets(world);
    expect(worldStaff.system.equipped).toBe(true);
    // Token still unequipped until its own ensure/reconcile runs.
    expect(tokenStaff.system.equipped).toBe(false);
    expect(resolveEquippedWeaponForAttackType([tokenStaff], 'melee', token)?.system?.damage).toBe(
      '7d8',
    );

    await ensureWeaponSets(token);
    expect(tokenStaff.system.equipped).toBe(true);
    expect(tokenStaff.getFlag('mastery-system', 'equipment').slot).toBe('mainhand');
  });

  it('derived combat fields treat set Artifact as active weapon (not Unarmed)', () => {
    const { actor, staff } = staffActor();
    const resolved = resolveEquippedWeaponForAttackType([staff], 'melee', actor);
    const activeWeaponName = resolved && !resolved.system?.virtualUnarmed ? resolved.name : 'Unarmed';
    const activeWeaponId = resolved && !resolved.system?.virtualUnarmed ? resolved.id : null;
    expect(activeWeaponName).toBe("Lor-Keth's Staff - Level 3-1");
    expect(activeWeaponId).toBe(staff.id);
  });
});
