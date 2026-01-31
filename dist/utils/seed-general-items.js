import { WEAPONS } from './weapons.js';
import { BASE_ARMOR, BASE_SHIELDS } from './equipment.js';
const STORAGE_FOLDER_NAME = 'General Items Storage';
const GEAR_ITEMS = [
    { name: 'Backpack', inventorySize: '2x3' },
    { name: 'Belt Pouch', inventorySize: '1x1' },
    { name: 'Bit and bridle', inventorySize: '2x2' },
    { name: 'Candles, 12', inventorySize: '1x2' },
    { name: 'Chalk, small bag', inventorySize: '1x1' },
    { name: 'Cloak', inventorySize: '2x2' },
    { name: 'Clothing, common', inventorySize: '2x2' },
    { name: 'Glass bottle or vial', inventorySize: '1x1' },
    { name: 'Grappling Hook', inventorySize: '2x2' },
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
    { name: 'Quiver or Bolt case', inventorySize: '2x2' },
    { name: 'Rations, Dry, one week', inventorySize: '2x2' },
    { name: 'Rope, Hemp 50 ft.', inventorySize: '2x2' },
    { name: 'Rope, Silk 50 ft.', inventorySize: '2x2' },
    { name: 'Sack, Large', inventorySize: '2x2' },
    { name: 'Sack, Small', inventorySize: '1x2' },
    { name: 'Saddle, Pack', inventorySize: '3x3' },
    { name: 'Saddle, Riding', inventorySize: '3x3' },
    { name: 'Saddlebags, pair', inventorySize: '3x2' },
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
const GEAR_SIZE_BY_NAME = Object.fromEntries(GEAR_ITEMS.map(item => [item.name.toLowerCase(), item.inventorySize]));
const ARMOR_SIZES = {
    light: '2x4',
    medium: '4x4',
    heavy: '4x6'
};
const SHIELD_SIZES = {
    parry: '2x2',
    medium: '2x3',
    tower: '3x4'
};
function isRangedWeapon(innateAbilities) {
    return (innateAbilities || []).some(ability => ability.toLowerCase().includes('ranged'));
}
function getWeaponInventorySize(hands, ranged, name) {
    if (name.toLowerCase() === 'unarmed') {
        return '1x1';
    }
    if (ranged) {
        return '2x4';
    }
    return hands === 2 ? '1x5' : '1x3';
}
export function getDefaultInventorySizeForItemData(item) {
    if (!item)
        return null;
    const type = item.type || item.system?.type;
    const name = (item.name || '').toLowerCase();
    if (type === 'gear') {
        return GEAR_SIZE_BY_NAME[name] || null;
    }
    if (type === 'weapon') {
        const hands = Number(item.system?.hands || 1);
        const weaponType = (item.system?.weaponType || '').toString().toLowerCase();
        const ranged = weaponType === 'ranged' || isRangedWeapon(item.system?.innateAbilities);
        return getWeaponInventorySize(hands, ranged, item.name || '');
    }
    if (type === 'armor') {
        const armorType = (item.system?.type || '').toString().toLowerCase();
        return ARMOR_SIZES[armorType] || null;
    }
    if (type === 'shield') {
        const shieldType = (item.system?.type || '').toString().toLowerCase();
        return SHIELD_SIZES[shieldType] || null;
    }
    return null;
}
export async function seedGeneralItemsStorage() {
    if (!game.user?.isGM) {
        // Non-GMs cannot seed items
        return [];
    }
    console.log('Mastery System | Seeding General Items Storage...');
    const existingFolder = game.folders?.find((f) => f.name === STORAGE_FOLDER_NAME && f.type === 'Item');
    const folder = existingFolder
        ? existingFolder
        : await Folder.create({ name: STORAGE_FOLDER_NAME, type: 'Item' });
    console.log('Mastery System | Storage folder resolved:', folder?.id, folder?.name);
    const existingItems = Array.from(game.items || []).filter((item) => item.folder?.id === folder.id);
    const existingNames = new Set(existingItems.map((item) => item.name));
    console.log('Mastery System | Existing storage items:', existingItems.length);
    const itemsToCreate = [];
    for (const gear of GEAR_ITEMS) {
        if (existingNames.has(gear.name))
            continue;
        itemsToCreate.push({
            name: gear.name,
            type: 'gear',
            folder: folder.id,
            img: 'icons/svg/item-bag.svg',
            system: {
                description: '',
                inventorySize: gear.inventorySize,
                weight: gear.weight ?? 0,
                quantity: 1,
                equipped: false,
                ...(gear.price !== undefined && { price: gear.price })
            }
        });
    }
    for (const weapon of WEAPONS) {
        if (existingNames.has(weapon.name))
            continue;
        const ranged = isRangedWeapon(weapon.innateAbilities);
        const weaponType = ranged ? 'ranged' : 'melee';
        const specials = weapon.special && weapon.special !== '—' ? [weapon.special] : [];
        itemsToCreate.push({
            name: weapon.name,
            type: 'weapon',
            folder: folder.id,
            img: ranged ? 'icons/svg/bow.svg' : 'icons/svg/sword.svg',
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
                ...(weapon.price !== undefined && { price: weapon.price })
            }
        });
    }
    for (const armor of BASE_ARMOR) {
        if (existingNames.has(armor.name))
            continue;
        itemsToCreate.push({
            name: armor.name,
            type: 'armor',
            folder: folder.id,
            img: 'icons/svg/armor.svg',
            system: {
                description: armor.description || '',
                inventorySize: ARMOR_SIZES[armor.type] || '2x4',
                armorValue: armor.armorValue,
                type: armor.type,
                equipped: false
            }
        });
    }
    for (const shield of BASE_SHIELDS) {
        if (existingNames.has(shield.name))
            continue;
        itemsToCreate.push({
            name: shield.name,
            type: 'shield',
            folder: folder.id,
            img: 'icons/svg/shield.svg',
            system: {
                description: shield.description || '',
                inventorySize: SHIELD_SIZES[shield.type] || '2x2',
                shieldValue: shield.shieldValue,
                type: shield.type,
                equipped: false
            }
        });
    }
    if (itemsToCreate.length === 0) {
        // Items already exist, silently return
        return [];
    }
    const createdItems = await Item.createDocuments(itemsToCreate, { render: false });
    if (itemsToCreate.length > 0) {
        ui.notifications?.info(`Created ${itemsToCreate.length} items in General Items Storage.`);
    }
    if (!createdItems || createdItems.length === 0) {
        console.warn('Mastery System | Seeding completed but no items were created.');
    }
    else {
        console.log('Mastery System | Seeded items:', createdItems.length);
    }
    return createdItems ?? [];
}
//# sourceMappingURL=seed-general-items.js.map