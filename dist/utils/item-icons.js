const ICON_BASE = 'systems/mastery-system/assets/icons/items';
/** Normalize weapon display names for icon lookup (hyphens, repeated spaces). */
export function normalizeWeaponNameKey(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/-/g, ' ');
}
/**
 * Gear name → icon path. Keys use ASCII apostrophe; lookup normalizes Unicode ’ to '.
 * Custom PNGs under `assets/icons/items/gear/` should match what the file shows (bottle, rope, …).
 * Where no PNG fits, Foundry core SVGs are used so we do not show misleading art.
 */
const GEAR_ICONS = {
    // --- Liquids / small vessels → Glass Bottle.png ---
    'glass bottle or vial': `${ICON_BASE}/gear/Glass Bottle.png`,
    'holy water (vial)': `${ICON_BASE}/gear/Glass Bottle.png`,
    'oil (flask)': `${ICON_BASE}/gear/Glass Bottle.png`,
    'ink (jar)': `${ICON_BASE}/gear/Glass Bottle.png`,
    'wineskin/waterskin': `${ICON_BASE}/gear/Glass Bottle.png`,
    // --- Rope / line → Rope.png ---
    'rope, hemp 50 ft.': `${ICON_BASE}/gear/Rope.png`,
    'rope, silk 50 ft.': `${ICON_BASE}/gear/Rope.png`,
    'grappling hook': `${ICON_BASE}/gear/Rope.png`,
    // --- Bedding / shelter / fabric bundles → Bedroll.png ---
    'winter blanket': `${ICON_BASE}/gear/Bedroll.png`,
    'tent, small': `${ICON_BASE}/gear/Bedroll.png`,
    'tent, large': `${ICON_BASE}/gear/Bedroll.png`,
    'cloak': `${ICON_BASE}/gear/Bedroll.png`,
    'clothing, common': `${ICON_BASE}/gear/Bedroll.png`,
    'rations, dry, one week': `${ICON_BASE}/gear/Bedroll.png`,
    // --- Small pouches → Herbs Pouch.png (pouch silhouette; not only herbs) ---
    'herbs pouch': `${ICON_BASE}/gear/Herbs Pouch.png`,
    'belt pouch': `${ICON_BASE}/gear/Herbs Pouch.png`,
    'chalk, small bag': `${ICON_BASE}/gear/Herbs Pouch.png`,
    // --- Dedicated art ---
    whistle: `${ICON_BASE}/gear/Whistle.png`,
    soap: `${ICON_BASE}/gear/Soap.png`,
    // --- Ammunition container → Arrow.png (quiver) ---
    'quiver or bolt case': `${ICON_BASE}/weapons/Arrow.png`,
    // --- No matching PNG: only Foundry core paths used elsewhere in this system (no 404) ---
    backpack: 'icons/svg/item-bag.svg',
    'bit and bridle': 'icons/svg/item-bag.svg',
    'candles, 12': 'icons/svg/lightning.svg',
    'holy symbol': 'icons/svg/aura.svg',
    'horseshoes & shoeing': 'icons/svg/item-bag.svg',
    'iron spikes, 12': 'icons/svg/item-bag.svg',
    'ladder, 10 ft.': 'icons/svg/item-bag.svg',
    lantern: 'icons/svg/lightning.svg',
    'lantern, bullseye': 'icons/svg/lightning.svg',
    'lantern, hooded': 'icons/svg/lightning.svg',
    manacles: 'icons/svg/item-bag.svg',
    'map or scroll case': 'icons/svg/chest.svg',
    'mirror, small metal': 'icons/svg/item-bag.svg',
    padlock: 'icons/svg/item-bag.svg',
    'paper (sheet)': 'icons/svg/chest.svg',
    "pole, 10' wooden": 'icons/svg/item-bag.svg',
    quill: 'icons/svg/item-bag.svg',
    'quill knife': 'icons/svg/sword.svg',
    'sack, large': 'icons/svg/item-bag.svg',
    'sack, small': 'icons/svg/item-bag.svg',
    'saddle, pack': 'icons/svg/item-bag.svg',
    'saddle, riding': 'icons/svg/item-bag.svg',
    'saddlebags, pair': 'icons/svg/item-bag.svg',
    spellbook: 'icons/svg/chest.svg',
    "thieves' picks and tools": 'icons/svg/item-bag.svg',
    tinderbox: 'icons/svg/lightning.svg',
    'torches, 6': 'icons/svg/lightning.svg',
    whetstone: 'icons/svg/item-bag.svg'
};
/** Normalize gear keys so curly apostrophes match GEAR_ICONS (ASCII '). */
export function normalizeGearIconKey(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\u2019/g, "'")
        .replace(/\u2018/g, "'");
}
const WEAPON_ICONS = {
    /** No custom fist art yet */
    unarmed: 'icons/svg/mystery-man.svg',
    dagger: `${ICON_BASE}/weapons/Dagger.png`,
    'short sword': `${ICON_BASE}/weapons/shortsword.png`,
    shortsword: `${ICON_BASE}/weapons/shortsword.png`,
    rapier: `${ICON_BASE}/weapons/rapier.png`,
    spear: `${ICON_BASE}/weapons/spear.png`,
    whip: `${ICON_BASE}/weapons/Whip.png`,
    shortbow: `${ICON_BASE}/weapons/Shortbow.png`,
    'short bow': `${ICON_BASE}/weapons/Shortbow.png`,
    longbow: `${ICON_BASE}/weapons/Shortbow.png`,
    'long bow': `${ICON_BASE}/weapons/Shortbow.png`,
    /** Until Crossbow.png exists; not bolt ammo */
    'light crossbow': `${ICON_BASE}/weapons/Shortbow.png`,
    'heavy crossbow': `${ICON_BASE}/weapons/Shortbow.png`,
    arrows: `${ICON_BASE}/weapons/Arrow.png`,
    'crossbow bolts': `${ICON_BASE}/weapons/Bolts.png`,
    /**
     * One-handed blades (no separate Longsword.png yet — art is a medium blade).
     * Replace with dedicated files when assets match names.
     */
    longsword: `${ICON_BASE}/weapons/shortsword.png`,
    handaxe: `${ICON_BASE}/weapons/shortsword.png`,
    /** Axes / heavy chopping — placeholder until Battleaxe.png / Greataxe.png */
    battleaxe: `${ICON_BASE}/weapons/shortsword.png`,
    greataxe: `${ICON_BASE}/weapons/shortsword.png`,
    /** Blunt — placeholder until hammer art */
    warhammer: `${ICON_BASE}/weapons/shortsword.png`,
    maul: `${ICON_BASE}/weapons/shortsword.png`,
    /** Flexible / chain */
    flail: `${ICON_BASE}/weapons/Whip.png`,
    /** Polearms & staff — spear/stick silhouette */
    glaive: `${ICON_BASE}/weapons/spear.png`,
    halberd: `${ICON_BASE}/weapons/spear.png`,
    quarterstaff: `${ICON_BASE}/weapons/spear.png`,
    greatsword: `${ICON_BASE}/weapons/shortsword.png`
};
const ARMOR_ICONS = {
    'light armor': `${ICON_BASE}/armor/LightArmor.png`,
    'medium armor': `${ICON_BASE}/armor/ArmorMedium.png`,
    'heavy armor': `${ICON_BASE}/armor/HeavyArmor.png`
};
const ARMOR_BY_TIER = {
    light: `${ICON_BASE}/armor/LightArmor.png`,
    medium: `${ICON_BASE}/armor/ArmorMedium.png`,
    heavy: `${ICON_BASE}/armor/HeavyArmor.png`
};
const SHIELD_ICONS = {
    'parry shield': `${ICON_BASE}/shields/ShieldParry.png`,
    'medium shield': `${ICON_BASE}/shields/MediumShield.png`,
    'tower shield': `${ICON_BASE}/shields/TowerShield.png`,
    'heavy shield': `${ICON_BASE}/shields/TowerShield.png`
};
const SHIELD_BY_TYPE = {
    parry: `${ICON_BASE}/shields/ShieldParry.png`,
    medium: `${ICON_BASE}/shields/MediumShield.png`,
    tower: `${ICON_BASE}/shields/TowerShield.png`
};
const DEFAULT_TYPE_ICONS = {
    weapon: `${ICON_BASE}/weapons/Dagger.png`,
    /** Generic armor only — never use a specific tier image here (would mis-label heavy/medium). */
    armor: 'icons/svg/armor.svg',
    /** Generic shield — avoid defaulting to “medium” art for tower/parry. */
    shield: 'icons/svg/shield.svg',
    /** Misc gear with no specific row in GEAR_ICONS */
    gear: 'icons/svg/item-bag.svg',
    power: 'icons/svg/aura.svg',
    artifact: 'icons/svg/chest.svg',
    schtick: 'icons/svg/lightning.svg',
    condition: 'icons/svg/acid.svg',
    echo: 'icons/svg/sound.svg',
};
const ECHO_ARTIFACT_ICON_BASE = `${ICON_BASE}/echo-artifacts`;
const GENERAL_ARTIFACT_ICON_BASE = `${ICON_BASE}/general-artifacts`;
/** Echo Artifact key → custom icon under `assets/icons/items/echo-artifacts/`. */
const ECHO_ARTIFACT_ICONS = {
    stoneboundSoles: `${ECHO_ARTIFACT_ICON_BASE}/Stonebound Soles.png`,
    elorianStride: `${ECHO_ARTIFACT_ICON_BASE}/Elven Stride.png`,
    elvenStride: `${ECHO_ARTIFACT_ICON_BASE}/Elven Stride.png`,
    wyrmScalesHeavy: `${ECHO_ARTIFACT_ICON_BASE}/Wyrm Scales.png`,
    wyrmScalesLight: `${ECHO_ARTIFACT_ICON_BASE}/Serpent Scales.png`,
    dragonClaws: `${ECHO_ARTIFACT_ICON_BASE}/Dragon Claws.png`,
    dragonHead: `${ECHO_ARTIFACT_ICON_BASE}/Dragon Head.png`,
    sentinelFrame: `${ECHO_ARTIFACT_ICON_BASE}/Sentinel Frame.png`,
    judicatorFrame: `${ECHO_ARTIFACT_ICON_BASE}/Judicator Frame.png`,
    oracleFrame: `${ECHO_ARTIFACT_ICON_BASE}/Oracle Frame.png`,
};
/** General (bound) Artifact key → custom icon under `assets/icons/items/general-artifacts/`. */
const GENERAL_ARTIFACT_ICONS = {
    moonlightGreatsword: `${GENERAL_ARTIFACT_ICON_BASE}/Sword of the Moon.png`,
    soulSigil: `${GENERAL_ARTIFACT_ICON_BASE}/Soul Sigil.jpg`,
    frostboundReturningAxe: `${GENERAL_ARTIFACT_ICON_BASE}/Frostbite.png`,
    lorKethsStaff: `${GENERAL_ARTIFACT_ICON_BASE}/Sword of Destiny.png`,
    heartOfWinter: `${GENERAL_ARTIFACT_ICON_BASE}/HeartofIce.png`,
    heartseeker: `${GENERAL_ARTIFACT_ICON_BASE}/Heartseeker.png`,
    falconWideBrim: `${GENERAL_ARTIFACT_ICON_BASE}/Falcon Wide Brim.png`,
};
/**
 * Custom icon for a seeded Echo or General Artifact tree (all levels share the same art).
 * Returns null when no dedicated PNG exists for the key.
 */
export function getEchoArtifactIcon(echoArtifactKey) {
    const key = String(echoArtifactKey || '').trim();
    if (!key)
        return null;
    if (ECHO_ARTIFACT_ICONS[key])
        return ECHO_ARTIFACT_ICONS[key];
    if (GENERAL_ARTIFACT_ICONS[key])
        return GENERAL_ARTIFACT_ICONS[key];
    // All Titan Scars attribute variants share one icon.
    if (key.startsWith('titanScars')) {
        return `${ECHO_ARTIFACT_ICON_BASE}/Titan Scars.png`;
    }
    return null;
}
/** Build an icon lookup hint from a live or pending Item document. */
export function getItemIconHintFromItem(item) {
    const echoArtifactKey = String(item.getFlag?.('mastery-system', 'echoArtifactKey') ?? item.system?.echoArtifactKey ?? '').trim();
    return {
        type: item.system?.type,
        ...(echoArtifactKey ? { echoArtifactKey } : {}),
    };
}
/** Build an icon lookup hint from preCreateItem data (flags may not be on `system`). */
export function getItemIconHintFromCreateData(data) {
    const echoArtifactKey = String(data.flags?.['mastery-system']?.echoArtifactKey ?? data.system?.echoArtifactKey ?? '').trim();
    return {
        type: data.system?.type,
        ...(echoArtifactKey ? { echoArtifactKey } : {}),
    };
}
/**
 * Resolve the best icon path for an item by name and type.
 * For armor and shields, pass `system` (with `type` tier) so renamed items still match the correct art.
 * Returns null if no custom icon is available.
 */
export function getItemIcon(name, type, system) {
    const key = name.toLowerCase().trim();
    if (type === 'weapon') {
        const wkey = normalizeWeaponNameKey(name);
        if (WEAPON_ICONS[wkey])
            return WEAPON_ICONS[wkey];
        const collapsed = wkey.replace(/ /g, '');
        if (collapsed !== wkey && WEAPON_ICONS[collapsed])
            return WEAPON_ICONS[collapsed];
    }
    if (type === 'armor') {
        if (ARMOR_ICONS[key])
            return ARMOR_ICONS[key];
        const tier = (system?.type || '').toString().toLowerCase();
        if (tier && ARMOR_BY_TIER[tier])
            return ARMOR_BY_TIER[tier];
    }
    if (type === 'shield') {
        if (SHIELD_ICONS[key])
            return SHIELD_ICONS[key];
        const st = (system?.type || '').toString().toLowerCase();
        if (st && SHIELD_BY_TYPE[st])
            return SHIELD_BY_TYPE[st];
    }
    if (type === 'gear') {
        const gkey = normalizeGearIconKey(name);
        if (GEAR_ICONS[gkey])
            return GEAR_ICONS[gkey];
    }
    if (type === 'artifact') {
        const echoKey = String(system?.echoArtifactKey || '').trim();
        const fromKey = echoKey ? getEchoArtifactIcon(echoKey) : null;
        if (fromKey)
            return fromKey;
    }
    return DEFAULT_TYPE_ICONS[type] || null;
}
//# sourceMappingURL=item-icons.js.map