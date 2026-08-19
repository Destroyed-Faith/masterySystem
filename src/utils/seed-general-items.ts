import { WEAPONS, masteryWeaponCatalogKey } from './weapons';
import { BASE_ARMOR, BASE_SHIELDS } from './equipment';
import { getItemIcon, normalizeWeaponNameKey } from './item-icons';
import { migrateItemAmmunitionFields } from './ammunition';
const STORAGE_FOLDER_NAME = 'General Items Storage';

const GEAR_ITEMS: Array<{ name: string; price?: number; weight?: number; inventorySize: string }> = [
  { name: 'Backpack', inventorySize: '2x3' },
  { name: 'Belt Pouch', inventorySize: '1x1' },
  { name: 'Bit and bridle', inventorySize: '2x2' },
  { name: 'Candles, 12', inventorySize: '1x2' },
  { name: 'Chalk, small bag', inventorySize: '1x1' },
  { name: 'Cloak', inventorySize: '2x2' },
  { name: 'Clothing, common', inventorySize: '2x2' },
  { name: 'Glass bottle or vial', inventorySize: '1x1' },
  { name: 'Grappling Hook', inventorySize: '2x2' },
  { name: 'Herbs Pouch', inventorySize: '1x1' },
  { name: 'Holy Symbol', inventorySize: '1x1' },
  { name: 'Holy Water (vial)', inventorySize: '1x1' },
  { name: 'Horseshoes & shoeing', inventorySize: '2x2' },
  { name: 'Ink (jar)', inventorySize: '1x1' },
  { name: 'Iron Spikes, 12', inventorySize: '1x2' },
  { name: 'Ladder, 10 ft.', inventorySize: '1x4' },
  { name: 'Lantern', inventorySize: '2x2' },
  { name: 'Lantern, Bullseye', inventorySize: '2x2' },
  { name: 'Lantern, Hooded', inventorySize: '2x2' },
  { name: 'Manacles', inventorySize: '2x1' },
  { name: 'Map or scroll case', inventorySize: '2x1' },
  { name: 'Mirror, small metal', inventorySize: '1x1' },
  { name: 'Oil (flask)', inventorySize: '1x1' },
  { name: 'Padlock', inventorySize: '1x1' },
  { name: 'Paper (sheet)', inventorySize: '1x1' },
  { name: 'Pole, 10’ wooden', inventorySize: '1x4' },
  { name: 'Quill', inventorySize: '1x1' },
  { name: 'Quill Knife', inventorySize: '1x1' },
  { name: 'Rations, Dry, one week', inventorySize: '2x2' },
  { name: 'Rope, Hemp 50 ft.', inventorySize: '2x2' },
  { name: 'Rope, Silk 50 ft.', inventorySize: '2x2' },
  { name: 'Sack, Large', inventorySize: '2x2' },
  { name: 'Sack, Small', inventorySize: '1x2' },
  { name: 'Saddle, Pack', inventorySize: '3x3' },
  { name: 'Saddle, Riding', inventorySize: '3x3' },
  { name: 'Saddlebags, pair', inventorySize: '3x2' },
  { name: 'Soap', inventorySize: '1x1' },
  { name: 'Spellbook', inventorySize: '2x2' },
  { name: 'Tent, Large', inventorySize: '4x3' },
  { name: 'Tent, Small', inventorySize: '3x2' },
  { name: 'Thieves’ picks and tools', inventorySize: '2x2' },
  { name: 'Tinderbox', inventorySize: '1x1' },
  { name: 'Torches, 6', inventorySize: '1x2' },
  { name: 'Whetstone', inventorySize: '1x1' },
  { name: 'Whistle', inventorySize: '1x1' },
  { name: 'Wineskin/Waterskin', inventorySize: '1x2' },
  { name: 'Winter blanket', inventorySize: '3x2' }
];

const GEAR_SIZE_BY_NAME: Record<string, string> = {
  ...Object.fromEntries(GEAR_ITEMS.map(item => [item.name.toLowerCase(), item.inventorySize])),
  arrows: '1x2',
  bolts: '1x1',
  'crossbow bolts': '1x1',
  'arrow quiver': '2x2',
  'bolt quiver': '2x2',
};

const ARMOR_SIZES: Record<string, string> = {
  light: '2x4',
  medium: '4x4',
  heavy: '4x6'
};

const SHIELD_SIZES: Record<string, string> = {
  parry: '2x2',
  medium: '2x3',
  tower: '3x4'
};

const AMMO_STACK_ITEMS: Array<{
  name: string;
  ammunitionType: 'arrow' | 'bolt';
  inventorySize: string;
  quantity: number;
  maxStack: number;
}> = [
  { name: 'Arrows', ammunitionType: 'arrow', inventorySize: '1x2', quantity: 24, maxStack: 24 },
  { name: 'Bolts', ammunitionType: 'bolt', inventorySize: '1x1', quantity: 24, maxStack: 24 },
];

const AMMO_CONTAINER_ITEMS: Array<{
  name: string;
  ammunitionType: 'arrow' | 'bolt';
  inventorySize: string;
  capacity: number;
}> = [
  { name: 'Arrow Quiver', ammunitionType: 'arrow', inventorySize: '2x2', capacity: 24 },
  { name: 'Bolt Quiver', ammunitionType: 'bolt', inventorySize: '2x2', capacity: 24 },
];

const WEAPON_INVENTORY_OVERRIDES: Record<string, string> = {
  unarmed: '1x1',
  rapier: '1x3',
  spear: '1x4',
  arrows: '1x2',
  bolts: '1x1',
  'crossbow bolts': '1x1',
  'arrow quiver': '2x2',
  'bolt quiver': '2x2',
};

function isRangedWeapon(innateAbilities: string[] | undefined): boolean {
  return (innateAbilities || []).some(ability => ability.toLowerCase().includes('ranged'));
}

function getWeaponInventorySize(hands: number, ranged: boolean, name: string): string {
  const key = normalizeWeaponNameKey(name);
  const fixed = WEAPON_INVENTORY_OVERRIDES[key];
  if (fixed) return fixed;
  if (ranged) {
    return '2x4';
  }
  return hands === 2 ? '1x5' : '1x3';
}

export function getDefaultInventorySizeForItemData(item: any): string | null {
  if (!item) return null;
  /** Document type only — never use `system.type` (armor/shield tier would mis-classify weapons). */
  const docType = item.type;
  if (!docType) return null;
  const name = (item.name || '').toLowerCase();

  if (docType === 'gear') {
    return GEAR_SIZE_BY_NAME[name] || null;
  }

  if (docType === 'weapon') {
    const overrideKey = normalizeWeaponNameKey(item.name || '');
    if (WEAPON_INVENTORY_OVERRIDES[overrideKey]) {
      return WEAPON_INVENTORY_OVERRIDES[overrideKey];
    }
    const hands = Number(item.system?.hands || 1);
    const weaponType = (item.system?.weaponType || '').toString().toLowerCase();
    const ranged = weaponType === 'ranged' || isRangedWeapon(item.system?.innateAbilities);
    return getWeaponInventorySize(hands, ranged, item.name || '');
  }

  if (docType === 'armor') {
    const armorType = (item.system?.type || '').toString().toLowerCase();
    return ARMOR_SIZES[armorType] || null;
  }

  if (docType === 'shield') {
    const shieldType = (item.system?.type || '').toString().toLowerCase();
    return SHIELD_SIZES[shieldType] || null;
  }

  return null;
}

export async function seedGeneralItemsStorage(): Promise<any[]> {
  if (!game.user?.isGM) {
    // Non-GMs cannot seed items
    return [];
  }
  const existingFolder = (game as any).folders?.find((f: any) => f.name === STORAGE_FOLDER_NAME && f.type === 'Item');
  const folder = existingFolder
    ? existingFolder
    : await (Folder as any).create({ name: STORAGE_FOLDER_NAME, type: 'Item' });
  const existingItems = Array.from((game as any).items || []).filter((item: any) => item.folder?.id === folder.id);
  const existingNames = new Set(existingItems.map((item: any) => item.name));
  const existingWeaponCatalogKeys = new Set(
    existingItems.map((item: any) => masteryWeaponCatalogKey(item.name || ''))
  );
  const itemsToCreate: any[] = [];

  for (const gear of GEAR_ITEMS) {
    if (existingNames.has(gear.name)) continue;
    itemsToCreate.push({
      name: gear.name,
      type: 'gear',
      folder: folder.id,
      img: getItemIcon(gear.name, 'gear') || 'icons/svg/item-bag.svg',
      system: {
        description: '',
        inventorySize: gear.inventorySize,
        weight: gear.weight ?? 0,
        quantity: 1,
        equipped: false,
        equipSlots: [],
        ...(gear.price !== undefined && { price: gear.price })
      }
    });
  }

  for (const weapon of WEAPONS) {
    if (existingNames.has(weapon.name)) continue;
    if (existingWeaponCatalogKeys.has(masteryWeaponCatalogKey(weapon.name))) continue;
    const ranged = isRangedWeapon(weapon.innateAbilities);
    const weaponType = ranged ? 'ranged' : 'melee';
    const specials = weapon.special && weapon.special !== '—' ? [weapon.special] : [];
    itemsToCreate.push({
      name: weapon.name,
      type: 'weapon',
      folder: folder.id,
      img: getItemIcon(weapon.name, 'weapon') || (ranged ? 'icons/svg/bow.svg' : 'icons/svg/sword.svg'),
      system: {
        description: weapon.description || '',
        inventorySize: getWeaponInventorySize(weapon.hands, ranged, weapon.name),
        weaponType,
        damage: weapon.weaponDamage,
        range: ranged ? '10m' : '0m',
        hands: weapon.hands,
        innateAbilities: weapon.innateAbilities,
        specials,
        equipped: false,
        equipSlots: weapon.requiresAmmunition
          ? ['mainhand', 'offhand']
          : weapon.hands === 2
            ? ['mainhand']
            : ['mainhand', 'offhand'],
        ...(weapon.requiresAmmunition
          ? { requiresAmmunition: true, ammunitionType: weapon.ammunitionType }
          : {}),
        ...(weapon.price !== undefined && { price: weapon.price })
      }
    });
  }

  for (const ammo of AMMO_STACK_ITEMS) {
    if (existingNames.has(ammo.name)) continue;
    itemsToCreate.push({
      name: ammo.name,
      type: 'gear',
      folder: folder.id,
      img: getItemIcon(ammo.name, 'gear') || getItemIcon(ammo.name, 'weapon') || 'icons/svg/item-bag.svg',
      system: {
        description: '',
        inventorySize: ammo.inventorySize,
        weight: 0,
        quantity: ammo.quantity,
        maxStack: ammo.maxStack,
        equipped: false,
        equipSlots: [],
        ammunition: true,
        ammunitionType: ammo.ammunitionType,
        ammoContainer: false,
        capacity: 0,
        currentAmmunition: 0,
      }
    });
  }

  for (const quiver of AMMO_CONTAINER_ITEMS) {
    if (existingNames.has(quiver.name)) continue;
    itemsToCreate.push({
      name: quiver.name,
      type: 'gear',
      folder: folder.id,
      img: getItemIcon(quiver.name, 'gear') || 'icons/svg/item-bag.svg',
      system: {
        description: '',
        inventorySize: quiver.inventorySize,
        weight: 0,
        quantity: 1,
        equipped: false,
        equipSlots: ['mainhand', 'offhand'],
        ammunition: false,
        ammunitionType: quiver.ammunitionType,
        ammoContainer: true,
        capacity: quiver.capacity,
        currentAmmunition: 0,
      }
    });
  }

  for (const armor of BASE_ARMOR) {
    if (existingNames.has(armor.name)) continue;
    itemsToCreate.push({
      name: armor.name,
      type: 'armor',
      folder: folder.id,
      img: getItemIcon(armor.name, 'armor', { type: armor.type }) || 'icons/svg/armor.svg',
      system: {
        description: armor.description || '',
        inventorySize: ARMOR_SIZES[armor.type] || '2x4',
        armorValue: armor.armorValue,
        evadeModifier: armor.evadeModifier,
        skillPenalty: armor.skillPenalty === '—' ? '' : armor.skillPenalty,
        type: armor.type,
        equipped: false,
        equipSlots: ['body']
      }
    });
  }

  for (const shield of BASE_SHIELDS) {
    if (existingNames.has(shield.name)) continue;
    itemsToCreate.push({
      name: shield.name,
      type: 'shield',
      folder: folder.id,
      img: getItemIcon(shield.name, 'shield', { type: shield.type }) || 'icons/svg/shield.svg',
      system: {
        description: shield.description || '',
        inventorySize: SHIELD_SIZES[shield.type] || '2x2',
        shieldValue: shield.shieldValue,
        evadeBonus: shield.evadeBonus,
        type: shield.type,
        equipped: false,
        equipSlots: ['offhand']
      }
    });
  }

  for (const item of existingItems as any[]) {
    const patch = migrateItemAmmunitionFields(item);
    if (!patch) continue;
    try {
      await item.update(patch);
    } catch (err) {
      console.warn('Mastery System | Could not repair ammunition fields on', item.name, err);
    }
  }

  if (itemsToCreate.length === 0) {
    return [];
  }

  const createdItems = await (Item as any).createDocuments(itemsToCreate, { render: false });
  if (itemsToCreate.length > 0) {
    ui.notifications?.info(`Created ${itemsToCreate.length} items in General Items Storage.`);
  }
  if (!createdItems || createdItems.length === 0) {
    console.warn('Mastery System | Seeding completed but no items were created.');
  }
  return createdItems ?? [];
}

