import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/token-radial-menu.js', () => ({
  refreshRadialMenuActionLabelsIfOpenForActor: vi.fn(async () => undefined),
}));

import {
  attackUsesAmmunitionWeapon,
  consumeAmmunitionForAttack,
  countAmmunitionShotsForOption,
  evaluateAmmunitionAttack,
  getActiveAmmoPair,
  isAmmoContainer,
  isAmmunitionItem,
  isAmmoContainerEffectActive,
  loadAmmunitionIntoContainer,
  planAmmunitionStackSplit,
  planQuiverLoad,
  requiresAmmunition,
  resetAmmunitionLocks,
  validateHandEquip,
} from '../src/utils/ammunition.js';
import {
  applyWeaponSetHands,
  isNaturallyTwoHandedItem,
} from '../src/utils/weapon-sets.js';

function merge(target: any, source: any): any {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const out = { ...(target && typeof target === 'object' && !Array.isArray(target) ? target : {}) };
  for (const [k, v] of Object.entries(source)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k], v) : v;
  }
  return out;
}

function makeItem(id: string, opts: Record<string, any> = {}) {
  const equipment: Record<string, unknown> = {
    container: 'inventory',
    band: 'not',
    slot: opts.slot ?? null,
    grid: opts.grid ?? { x: 1, y: 1 },
  };
  if (opts.keepInventoryGrid) equipment.keepInventoryGrid = true;
  if (opts.weaponSetPrepared) equipment.weaponSetPrepared = true;
  const flags: Record<string, any> = { 'mastery-system': { equipment } };
  const item: any = {
    id,
    type: opts.type ?? 'gear',
    name: opts.name ?? id,
    parent: null as any,
    system: {
      equipped: opts.equipped ?? false,
      hands: opts.hands ?? 1,
      weaponType: opts.weaponType ?? 'melee',
      innateAbilities: opts.innates ?? [],
      quantity: opts.quantity ?? 1,
      maxStack: opts.maxStack ?? 0,
      ammunition: opts.ammunition ?? false,
      ammunitionType: opts.ammunitionType ?? '',
      ammoContainer: opts.ammoContainer ?? false,
      capacity: opts.capacity ?? 0,
      currentAmmunition: opts.currentAmmunition ?? 0,
      requiresAmmunition: opts.requiresAmmunition ?? false,
      equipSlots: opts.equipSlots ?? [],
    },
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async update(data: Record<string, unknown>) {
      if (data['system.equipped'] !== undefined) this.system.equipped = data['system.equipped'];
      if (data['system.quantity'] !== undefined) this.system.quantity = data['system.quantity'];
      if (data['system.currentAmmunition'] !== undefined) this.system.currentAmmunition = data['system.currentAmmunition'];
      if (data['flags.mastery-system.equipment']) {
        flags['mastery-system'].equipment = data['flags.mastery-system.equipment'];
      }
    },
    async delete() {
      const actor = this.parent;
      if (actor?.items) {
        const idx = actor.items.findIndex((it: any) => it.id === this.id);
        if (idx >= 0) actor.items.splice(idx, 1);
      }
    },
  };
  return item;
}

function makeActor(items: ReturnType<typeof makeItem>[], initialSets?: unknown) {
  const flags: Record<string, any> = {
    'mastery-system': initialSets ? { weaponSets: initialSets } : {},
  };
  const actor: any = {
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
    async deleteEmbeddedDocuments(_type: string, ids: string[]) {
      for (const id of ids) {
        const idx = items.findIndex((it) => it.id === id);
        if (idx >= 0) items.splice(idx, 1);
      }
    },
  };
  for (const item of items) item.parent = actor;
  return actor;
}

function bow(id = 'longbow') {
  return makeItem(id, {
    type: 'weapon',
    name: 'Longbow',
    weaponType: 'ranged',
    hands: 2,
    requiresAmmunition: true,
    ammunitionType: 'arrow',
    equipSlots: ['mainhand', 'offhand'],
  });
}

function crossbow(id = 'crossbow') {
  return makeItem(id, {
    type: 'weapon',
    name: 'Light Crossbow',
    weaponType: 'ranged',
    hands: 2,
    requiresAmmunition: true,
    ammunitionType: 'bolt',
    equipSlots: ['mainhand', 'offhand'],
  });
}

function arrows(id: string, quantity: number) {
  return makeItem(id, {
    type: 'gear',
    name: 'Arrows',
    ammunition: true,
    ammunitionType: 'arrow',
    quantity,
    maxStack: 24,
  });
}

function bolts(id: string, quantity: number) {
  return makeItem(id, {
    type: 'gear',
    name: 'Bolts',
    ammunition: true,
    ammunitionType: 'bolt',
    quantity,
    maxStack: 24,
  });
}

function arrowQuiver(id: string, current = 0, capacity = 24) {
  return makeItem(id, {
    type: 'gear',
    name: 'Arrow Quiver',
    ammoContainer: true,
    ammunitionType: 'arrow',
    currentAmmunition: current,
    capacity,
    equipSlots: ['mainhand', 'offhand'],
  });
}

function boltQuiver(id: string, current = 0, capacity = 24) {
  return makeItem(id, {
    type: 'gear',
    name: 'Bolt Quiver',
    ammoContainer: true,
    ammunitionType: 'bolt',
    currentAmmunition: current,
    capacity,
    equipSlots: ['mainhand', 'offhand'],
  });
}

describe('ammunition stacks', () => {
  it('caps a stack at 24 and splits larger amounts without losing shots', () => {
    expect(planAmmunitionStackSplit(24, 24)).toEqual([24]);
    expect(planAmmunitionStackSplit(48, 24)).toEqual([24, 24]);
    expect(planAmmunitionStackSplit(50, 24)).toEqual([24, 24, 2]);
    expect(planAmmunitionStackSplit(50, 24).reduce((a, b) => a + b, 0)).toBe(50);
  });

  it('treats Arrows and Bolts as ammunition items', () => {
    expect(isAmmunitionItem(arrows('a', 24))).toBe(true);
    expect(isAmmunitionItem(bolts('b', 24))).toBe(true);
    expect(isAmmunitionItem(bow())).toBe(false);
  });
});

describe('quiver loading', () => {
  beforeEach(() => resetAmmunitionLocks());

  it('loads 24 arrows into an empty arrow quiver and removes the stack', async () => {
    const quiver = arrowQuiver('q');
    const stack = arrows('a', 24);
    const actor = makeActor([quiver, stack]);
    const result = await loadAmmunitionIntoContainer(actor, stack, quiver);
    expect(result).toMatchObject({ ok: true, moved: 24, remaining: 0 });
    expect(quiver.system.currentAmmunition).toBe(24);
    expect(actor.items.find((it: any) => it.id === 'a')).toBeUndefined();
  });

  it('loads 24 bolts into an empty bolt quiver', async () => {
    const quiver = boltQuiver('q');
    const stack = bolts('b', 24);
    const actor = makeActor([quiver, stack]);
    const result = await loadAmmunitionIntoContainer(actor, stack, quiver);
    expect(result.ok).toBe(true);
    expect(quiver.system.currentAmmunition).toBe(24);
  });

  it('fills only the free space and leaves the rest on the stack', async () => {
    const quiver = arrowQuiver('q', 8);
    const stack = arrows('a', 24);
    const actor = makeActor([quiver, stack]);
    const result = await loadAmmunitionIntoContainer(actor, stack, quiver);
    expect(result).toMatchObject({ ok: true, moved: 16, remaining: 8 });
    expect(quiver.system.currentAmmunition).toBe(24);
    expect(stack.system.quantity).toBe(8);
  });

  it('rejects a full quiver and an incompatible stack', async () => {
    const full = arrowQuiver('full', 24);
    const stack = arrows('a', 12);
    const actor = makeActor([full, stack, arrowQuiver('empty'), bolts('b', 12)]);
    const fullResult = await loadAmmunitionIntoContainer(actor, stack, full);
    expect(fullResult.ok).toBe(false);
    expect(full.system.currentAmmunition).toBe(24);
    expect(stack.system.quantity).toBe(12);

    const empty = actor.items.find((it: any) => it.id === 'empty');
    const boltStack = actor.items.find((it: any) => it.id === 'b');
    const wrong = await loadAmmunitionIntoContainer(actor, boltStack, empty);
    expect(wrong.ok).toBe(false);
    expect(empty.system.currentAmmunition).toBe(0);
    expect(boltStack.system.quantity).toBe(12);
  });

  it('rejects arrows in a bolt quiver', async () => {
    const quiver = boltQuiver('q');
    const stack = arrows('a', 24);
    const actor = makeActor([quiver, stack]);
    const result = await loadAmmunitionIntoContainer(actor, stack, quiver);
    expect(result.ok).toBe(false);
    expect(quiver.system.currentAmmunition).toBe(0);
  });

  it('does not double-apply overlapping loads', async () => {
    const quiver = arrowQuiver('q', 20);
    const stack = arrows('a', 10);
    const actor = makeActor([quiver, stack]);
    const first = loadAmmunitionIntoContainer(actor, stack, quiver);
    const second = loadAmmunitionIntoContainer(actor, stack, quiver);
    const results = await Promise.all([first, second]);
    const moved = results.reduce((sum, r) => sum + r.moved, 0);
    expect(moved).toBe(4);
    expect(quiver.system.currentAmmunition).toBe(24);
    expect(stack.system.quantity + moved).toBe(10);
  });

  it('uses the quiver capacity field, not a hardcoded 24', () => {
    expect(planQuiverLoad(0, 48, 40)).toEqual({ moved: 40, remaining: 0, nextCurrent: 40 });
    expect(planQuiverLoad(40, 48, 20)).toEqual({ moved: 8, remaining: 12, nextCurrent: 48 });
  });
});

describe('hand slot pairing', () => {
  it('allows a longbow with an arrow quiver and rejects a shield or bolt quiver', () => {
    const longbow = bow();
    const quiver = arrowQuiver('q');
    const shield = makeItem('shield', { type: 'shield', name: 'Shield' });
    const wrong = boltQuiver('bq');
    const actor = makeActor([longbow, quiver, shield, wrong]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    expect(validateHandEquip(actor, quiver, 'offhand').ok).toBe(true);
    expect(validateHandEquip(actor, shield, 'offhand').ok).toBe(false);
    expect(validateHandEquip(actor, wrong, 'offhand').ok).toBe(false);
  });

  it('allows a crossbow with a bolt quiver and rejects a second weapon', () => {
    const weapon = crossbow();
    const quiver = boltQuiver('q');
    const sword = makeItem('sword', { type: 'weapon', name: 'Longsword', hands: 1 });
    const actor = makeActor([weapon, quiver, sword]);
    weapon.flags['mastery-system'].equipment.slot = 'mainhand';
    expect(validateHandEquip(actor, quiver, 'offhand').ok).toBe(true);
    expect(validateHandEquip(actor, sword, 'offhand').ok).toBe(false);
  });

  it('lets a quiver sit alone and does not treat ammo bows as the old same-id 2H grip', () => {
    const longbow = bow();
    const quiver = arrowQuiver('q');
    const actor = makeActor([longbow, quiver]);
    expect(validateHandEquip(actor, quiver, 'offhand').ok).toBe(true);
    expect(isNaturallyTwoHandedItem(longbow)).toBe(false);
    expect(isNaturallyTwoHandedItem(makeItem('greataxe', { type: 'weapon', hands: 2, name: 'Greataxe' }))).toBe(true);
  });

  it('does not require a quiver for thrown weapons', () => {
    const dagger = makeItem('dagger', {
      type: 'weapon',
      name: 'Dagger',
      hands: 1,
      innates: ['Thrown (4/8/16m)'],
    });
    expect(requiresAmmunition(dagger)).toBe(false);
    expect(attackUsesAmmunitionWeapon(makeActor([dagger]), { id: 'weapon-attack', slot: 'attack', range: 4 })).toBe(false);
  });
});

describe('attack gate and consumption', () => {
  beforeEach(() => resetAmmunitionLocks());

  it('blocks an incomplete pair, a wrong quiver, and an empty quiver', () => {
    const longbow = bow();
    const empty = arrowQuiver('empty', 0);
    const boltsQ = boltQuiver('bq', 24);
    const actor = makeActor([longbow, empty, boltsQ]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    longbow.system.equipped = true;
    expect(evaluateAmmunitionAttack(actor, 1).ok).toBe(false);

    empty.flags['mastery-system'].equipment.slot = 'offhand';
    empty.system.equipped = true;
    expect(evaluateAmmunitionAttack(actor, 1)).toMatchObject({ ok: false, reason: 'empty-quiver' });

    empty.flags['mastery-system'].equipment.slot = null;
    empty.system.equipped = false;
    boltsQ.flags['mastery-system'].equipment.slot = 'offhand';
    boltsQ.system.equipped = true;
    expect(evaluateAmmunitionAttack(actor, 1)).toMatchObject({ ok: false, reason: 'compatible-quiver-required' });
  });

  it('consumes one shot on a committed attack and never reads inventory stacks', async () => {
    const longbow = bow();
    const quiver = arrowQuiver('q', 5);
    const spare = arrows('spare', 24);
    const actor = makeActor([longbow, quiver, spare]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    longbow.system.equipped = true;
    quiver.flags['mastery-system'].equipment.slot = 'offhand';
    quiver.system.equipped = true;
    const result = await consumeAmmunitionForAttack(actor, 1);
    expect(result).toMatchObject({ ok: true, remaining: 4 });
    expect(quiver.system.currentAmmunition).toBe(4);
    expect(spare.system.quantity).toBe(24);
  });

  it('blocks when there is not enough ammunition for every actual shot', () => {
    const longbow = bow();
    const quiver = arrowQuiver('q', 1);
    const actor = makeActor([longbow, quiver]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    longbow.system.equipped = true;
    quiver.flags['mastery-system'].equipment.slot = 'offhand';
    quiver.system.equipped = true;
    expect(countAmmunitionShotsForOption({ splitAttack: true })).toBe(2);
    expect(evaluateAmmunitionAttack(actor, 2)).toMatchObject({ ok: false, reason: 'not-enough-ammunition' });
  });

  it('consumes two shots for two actual attacks', async () => {
    const longbow = bow();
    const quiver = arrowQuiver('q', 6);
    const actor = makeActor([longbow, quiver]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    longbow.system.equipped = true;
    quiver.flags['mastery-system'].equipment.slot = 'offhand';
    quiver.system.equipped = true;
    await consumeAmmunitionForAttack(actor, 2);
    expect(quiver.system.currentAmmunition).toBe(4);
  });
});

describe('weapon set integration', () => {
  beforeEach(() => {
    resetAmmunitionLocks();
    (globalThis as any).game = { combat: null };
  });

  it('keeps each set on its own quiver and uses only the active one after a swap', async () => {
    const longbow = bow();
    const quiverA = arrowQuiver('qa', 17);
    const quiverB = arrowQuiver('qb', 3);
    const actor = makeActor([longbow, quiverA, quiverB], {
      schemaVersion: 1,
      active: 1,
      sets: {
        1: { mainhand: 'longbow', offhand: 'qa' },
        2: { mainhand: 'longbow', offhand: 'qb' },
      },
    });
    await applyWeaponSetHands(actor, { mainhand: 'longbow', offhand: 'qa' });
    expect(getActiveAmmoPair(actor)?.quiver.id).toBe('qa');
    expect(isAmmoContainerEffectActive(actor, quiverA)).toBe(true);
    expect(isAmmoContainerEffectActive(actor, quiverB)).toBe(false);
    expect(evaluateAmmunitionAttack(actor, 1).ok).toBe(true);

    await applyWeaponSetHands(actor, { mainhand: 'longbow', offhand: 'qb' });
    expect(getActiveAmmoPair(actor)?.quiver.id).toBe('qb');
    expect(isAmmoContainerEffectActive(actor, quiverA)).toBe(false);
    expect(isAmmoContainerEffectActive(actor, quiverB)).toBe(true);
    expect(quiverB.system.currentAmmunition).toBe(3);
  });

  it('never pulls a quiver that is only sitting in inventory', () => {
    const longbow = bow();
    const inventoryQuiver = arrowQuiver('inv', 24);
    const actor = makeActor([longbow, inventoryQuiver]);
    longbow.flags['mastery-system'].equipment.slot = 'mainhand';
    longbow.system.equipped = true;
    expect(getActiveAmmoPair(actor)).toBeNull();
    expect(evaluateAmmunitionAttack(actor, 1).ok).toBe(false);
  });
});

describe('item classification', () => {
  it('recognizes ammo containers without treating them as ammunition stacks', () => {
    expect(isAmmoContainer(arrowQuiver('q'))).toBe(true);
    expect(isAmmunitionItem(arrowQuiver('q'))).toBe(false);
    expect(requiresAmmunition(bow())).toBe(true);
    expect(requiresAmmunition(crossbow())).toBe(true);
  });
});
