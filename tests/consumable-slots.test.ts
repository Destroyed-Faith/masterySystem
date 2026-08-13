import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONSUMABLE_I18N_KEYS,
  actorConsumableSlotCount,
  attackActionConsumableIds,
  buildConsumableAttackOption,
  buildConsumablePrintEntries,
  buildConsumablePrintSlots,
  buildConsumableRadialOptions,
  buildConsumableSlotView,
  consumableGrantsExtraAttack,
  consumableSlotCount,
  consumableUseActionPlan,
  consumableUseSpendsAttackAction,
  equippedConsumableActionRows,
  equipmentFlagsWithConsumableSlot,
  isConsumableCombatOption,
  isConsumableItem,
  itemDataForConsumableTransfer,
  listEquippedConsumableItems,
  readConsumableSlotIndex,
  shouldConsumeConsumableOnUse,
  slotsToUnequipAfterRankChange,
  storedPowerIgnoresWeapon,
  storedPowerKeepsSpecials,
  validateEquipConsumable,
} from '../src/utils/consumable-slots';

function consumableItem(id: string, slot: number | null, extras: Record<string, unknown> = {}) {
  return {
    id,
    name: `Potion ${id}`,
    img: 'icons/svg/acid.svg',
    type: 'gear',
    system: { consumable: true, ...(extras.system as object || {}) },
    flags: {
      'mastery-system': {
        equipment: slot == null ? { container: 'inventory', band: 'not' } : { container: 'inventory', consumableSlot: slot },
        minorMagic: extras.minorMagic ?? {
          creatorId: 'creator-1',
          creatorName: 'Alchemist',
          form: 'potion',
          snapshot: {
            powerId: 'pow-1',
            powerName: 'Single Attack',
            templateId: 'active-melee-damage-t3',
            templateName: 'Single Attack',
            powerLevel: 3,
            definitionRank: 3,
            category: 'active',
            actionCost: 'attack',
            isSpell: false,
            castingAttribute: '',
            attackPool: { attribute: 'might', numDice: 5, keepDice: 3 },
            damage: '3d8',
            healing: '—',
            range: 'Melee',
            aoe: 'Single',
            aoeShape: 'single',
            targets: 1,
            duration: 'Instant',
            specials: 'bleed(2)',
            effect: 'One melee attack.',
            chosenSpecialKey: 'bleed',
          },
        },
      },
    },
    getFlag(scope: string, key: string) {
      return (this as any).flags?.[scope]?.[key];
    },
    ...extras,
  };
}

function actorStub(rank: number, items: any[] = []) {
  return {
    id: 'act-1',
    name: 'Hero',
    system: { mastery: { rank } },
    items,
  };
}

function readLang(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'lang', file), 'utf8'));
}

function hasKey(obj: Record<string, unknown>, dotted: string): boolean {
  const parts = dotted.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object' || !(part in (cur as object))) return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' && String(cur).length > 0;
}

describe('slot count follows Mastery Rank', () => {
  it('1. slot count equals Mastery Rank', () => {
    expect(consumableSlotCount(2)).toBe(2);
    expect(consumableSlotCount(3)).toBe(3);
    expect(consumableSlotCount(4)).toBe(4);
    expect(actorConsumableSlotCount(actorStub(2))).toBe(2);
    expect(buildConsumableSlotView(actorStub(3)).slots).toHaveLength(3);
  });

  it('2. raising Mastery Rank adds empty slots', () => {
    const item = consumableItem('c1', 0);
    const before = buildConsumableSlotView(actorStub(2, [item]));
    expect(before.slots).toHaveLength(2);
    expect(before.slots[1].empty).toBe(true);
    const after = buildConsumableSlotView(actorStub(3, [item]));
    expect(after.slots).toHaveLength(3);
    expect(after.slots.filter((s) => s.empty)).toHaveLength(2);
  });

  it('3. lowering Mastery Rank never deletes items', () => {
    const overflow = consumableItem('c2', 2);
    const kept = consumableItem('c1', 0);
    const indexes = listEquippedConsumableItems(actorStub(3, [kept, overflow])).map((r) => r.index);
    expect(slotsToUnequipAfterRankChange(indexes, 2)).toEqual([2]);
    const unequipped = equipmentFlagsWithConsumableSlot(overflow.flags['mastery-system'].equipment, null);
    expect(unequipped.consumableSlot).toBeUndefined();
    expect(overflow.id).toBe('c2');
    expect(overflow.flags['mastery-system'].minorMagic.creatorId).toBe('creator-1');
  });
});

describe('equip validation', () => {
  it('4. consumables can be equipped into a free slot', () => {
    const item = consumableItem('c1', null);
    expect(validateEquipConsumable({ actor: actorStub(2, []), item, index: 0, inCombat: false })).toBeNull();
    const flags = equipmentFlagsWithConsumableSlot({ container: 'inventory' }, 0);
    expect(flags.consumableSlot).toBe(0);
    expect(readConsumableSlotIndex({ flags: { 'mastery-system': { equipment: flags } } })).toBe(0);
  });

  it('5. non-consumables are rejected at data level', () => {
    const weapon = { id: 'w1', type: 'weapon', system: { consumable: false }, flags: {} };
    expect(isConsumableItem(weapon)).toBe(false);
    expect(validateEquipConsumable({ actor: actorStub(2), item: weapon, index: 0, inCombat: false })).toBe(
      'not-consumable',
    );
    const armor = { id: 'a1', type: 'armor', system: {}, flags: {} };
    expect(validateEquipConsumable({ actor: actorStub(2), item: armor, index: 0, inCombat: false })).toBe(
      'not-consumable',
    );
  });

  it('6. one consumable cannot occupy two slots at once', () => {
    const item = consumableItem('c1', 0);
    const next = equipmentFlagsWithConsumableSlot(item.flags['mastery-system'].equipment, 1);
    expect(next.consumableSlot).toBe(1);
    expect(Object.keys(next).filter((k) => k === 'consumableSlot')).toHaveLength(1);
    const actor = actorStub(3, [item]);
    expect(listEquippedConsumableItems(actor).filter((r) => r.item.id === 'c1')).toHaveLength(1);
  });

  it('7. foreign consumables keep stored values and original creator', () => {
    const foreign = consumableItem('gift', null, {
      minorMagic: {
        creatorId: 'other-actor',
        creatorName: 'Other',
        form: 'grenade',
        snapshot: {
          powerName: 'Fire Bolt',
          attackPool: { attribute: 'intellect', numDice: 7, keepDice: 4 },
          damage: '4d8',
          specials: 'burn(1)',
        },
      },
    });
    const transferred = itemDataForConsumableTransfer(foreign);
    const flag = (transferred.flags as any)['mastery-system'].minorMagic;
    expect(flag.creatorId).toBe('other-actor');
    expect(flag.snapshot.attackPool.numDice).toBe(7);
    expect(flag.snapshot.damage).toBe('4d8');
    expect((transferred as any)._id).toBeUndefined();
  });
});

describe('attack-action surfaces only list equipped consumables', () => {
  it('8. sheet attack actions list only equipped consumables', () => {
    const equipped = consumableItem('eq', 0);
    const backpack = consumableItem('bag', null);
    const actor = actorStub(2, [equipped, backpack]);
    expect(attackActionConsumableIds(actor)).toEqual(['eq']);
    expect(equippedConsumableActionRows(actor).map((r) => r.itemId)).toEqual(['eq']);
  });

  it('9. radial menu lists only equipped consumables, once each', () => {
    const a = consumableItem('eq', 1);
    const bag = consumableItem('bag', null);
    const options = buildConsumableRadialOptions(actorStub(2, [a, bag, a]));
    expect(options.map((o) => o.consumableItemId)).toEqual(['eq']);
    expect(options[0].tags).toContain('consumable');
    expect(options[0].name).toMatch(/Consumable|eq|Single Attack/i);
    expect(isConsumableCombatOption(options[0])).toBe(true);
  });

  it('10. printable sheet attack actions list only equipped consumables', () => {
    const equipped = consumableItem('eq', 0);
    const bag = consumableItem('bag', null);
    const actor = actorStub(2, [equipped, bag]);
    const entries = buildConsumablePrintEntries(actor);
    expect(entries.map((e) => e.name)).toEqual([`${equipped.name} (Single Attack)`]);
    expect(entries[0].fromConsumable).toBe(true);
    const slots = buildConsumablePrintSlots(actor);
    expect(slots).toHaveLength(2);
    expect(slots[0].empty).toBe(false);
    expect(slots[1].empty).toBe(true);
    expect(slots[0].powerName).toBe('Single Attack');
  });
});

describe('attack economy and consume rules', () => {
  it('11. use spends an Attack Action in combat', () => {
    expect(consumableUseSpendsAttackAction()).toBe(true);
    expect(consumableUseActionPlan(true, 1)).toBe('spend-on-success');
    expect(buildConsumableAttackOption(actorStub(2), consumableItem('c1', 0)).costsAction).toBe(true);
  });

  it('12. use never grants an Extra Attack', () => {
    expect(consumableGrantsExtraAttack()).toBe(false);
    const option = buildConsumableAttackOption(actorStub(2), consumableItem('c1', 0));
    expect(option.tags).not.toContain('extra-attack');
    expect(option.costsAction).toBe(true);
  });

  it('13. a used consumable leaves slot, action list, and radial', () => {
    const remaining = consumableItem('left', 1);
    const actor = actorStub(2, [remaining]);
    expect(attackActionConsumableIds(actor)).toEqual(['left']);
    expect(buildConsumableRadialOptions(actor).map((o) => o.consumableItemId)).toEqual(['left']);
    expect(buildConsumableSlotView(actor).slots[0].empty).toBe(true);
  });

  it('14. an emptied slot cannot be refilled during the same combat', () => {
    const item = consumableItem('c1', null);
    expect(validateEquipConsumable({ actor: actorStub(2, []), item, index: 0, inCombat: true })).toBe(
      'in-combat',
    );
  });

  it('15. after combat the emptied slot can be filled again', () => {
    const item = consumableItem('c1', null);
    expect(validateEquipConsumable({ actor: actorStub(2, []), item, index: 0, inCombat: false })).toBeNull();
  });

  it('16. abort or failed use does not consume the item', () => {
    expect(shouldConsumeConsumableOnUse('abort')).toBe(false);
    expect(shouldConsumeConsumableOnUse('fail')).toBe(false);
    expect(shouldConsumeConsumableOnUse('success')).toBe(true);
  });
});

describe('stored power payload', () => {
  it('17. weapon damage and weapon specials are not added', () => {
    const snap = consumableItem('c1', 0).flags['mastery-system'].minorMagic.snapshot;
    expect(storedPowerIgnoresWeapon(snap)).toBe(true);
    const option = buildConsumableAttackOption(actorStub(2), consumableItem('c1', 0));
    expect(option.ignoreWeaponDamage).toBe(true);
    expect(option.storedAttackPool).toEqual({ attribute: 'might', numDice: 5, keepDice: 3 });
  });

  it('18. power effects and specials stay on the stored snapshot', () => {
    const item = consumableItem('c1', 0);
    const snap = item.flags['mastery-system'].minorMagic.snapshot;
    expect(storedPowerKeepsSpecials(snap)).toBe('bleed(2)');
    const option = buildConsumableAttackOption(actorStub(2), item);
    expect(option.powerData.specials).toEqual(['bleed(2)']);
    expect(option.item.system.effect).toBe('One melee attack.');
  });
});

describe('persistence and localization', () => {
  it('19. slot occupancy reloads from item flags and current Mastery Rank', () => {
    const item = consumableItem('c1', 1);
    const reloaded = actorStub(3, [item]);
    const view = buildConsumableSlotView(reloaded);
    expect(view.count).toBe(3);
    expect(view.slots[1].itemId).toBe('c1');
    expect(view.slots[0].empty).toBe(true);
    expect(readConsumableSlotIndex(item)).toBe(1);
  });

  it('20. German and English localization keys exist for every consumable string', () => {
    const en = readLang('en.json');
    const de = readLang('de.json');
    for (const key of CONSUMABLE_I18N_KEYS) {
      expect(hasKey(en, key), key).toBe(true);
      expect(hasKey(de, key), key).toBe(true);
    }
  });
});
