import { describe, expect, it } from 'vitest';

import { listCarriedItemsForPaperdollSlot } from '../src/utils/equip-slots.js';

function carried(spec: {
  id: string;
  name: string;
  type?: string;
  slots?: string[];
  slot?: string | null;
  consumableSlot?: number;
  weaponSetPrepared?: boolean;
}) {
  return {
    id: spec.id,
    name: spec.name,
    type: spec.type || 'gear',
    system: { equipSlots: spec.slots ?? [] },
    flags: {
      'mastery-system': {
        equipment: {
          container: 'inventory',
          slot: spec.slot ?? null,
          consumableSlot: spec.consumableSlot,
          weaponSetPrepared: spec.weaponSetPrepared,
        },
      },
    },
  };
}

describe('listCarriedItemsForPaperdollSlot', () => {
  it('returns unequipped inventory items that match the slot', () => {
    const helm = carried({ id: 'helm', name: 'Steel Helm', slots: ['head'] });
    const worn = carried({ id: 'crown', name: 'Crown', slots: ['head'], slot: 'head' });
    const ring = carried({ id: 'ring', name: 'Gold Ring', slots: ['ring'] });
    expect(listCarriedItemsForPaperdollSlot([helm, worn, ring], 'head').map((item) => item.id)).toEqual(['helm']);
  });

  it('normalizes legacy slot keys and sorts by name', () => {
    const boot = carried({ id: 'boot', name: 'Zed Boots', slots: ['boot'] });
    const shoes = carried({ id: 'shoes', name: 'Ashen Shoes', slots: ['feet'] });
    expect(listCarriedItemsForPaperdollSlot([boot, shoes], 'feet').map((item) => item.name)).toEqual([
      'Ashen Shoes',
      'Zed Boots',
    ]);
  });

  it('keeps off-hand weapons out unless the caller allows them', () => {
    const shield = carried({ id: 'shield', name: 'Shield', type: 'shield', slots: ['offhand'] });
    const bow = carried({ id: 'bow', name: 'Bow', type: 'weapon', slots: ['mainhand', 'offhand'] });
    expect(listCarriedItemsForPaperdollSlot([shield, bow], 'offhand').map((item) => item.id)).toEqual(['shield']);
    expect(
      listCarriedItemsForPaperdollSlot([shield, bow], 'offhand', {
        allowOffhandWeapon: (item) => item.id === 'bow',
      }).map((item) => item.id),
    ).toEqual(['bow', 'shield']);
  });
});
