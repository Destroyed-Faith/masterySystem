const ICON_BASE = 'systems/mastery-system/assets/icons/items';

const WEAPON_ICONS: Record<string, string> = {
  dagger: `${ICON_BASE}/weapons/Dagger.png`,
  'short sword': `${ICON_BASE}/weapons/shortsword.png`,
  rapier: `${ICON_BASE}/weapons/Rapier.png`,
  spear: `${ICON_BASE}/weapons/Spear.png`,
  whip: `${ICON_BASE}/weapons/Whip.png`,
  shortbow: `${ICON_BASE}/weapons/Shortbow.png`,
  // No separate longbow art yet — same silhouette as shortbow
  longbow: `${ICON_BASE}/weapons/Shortbow.png`,
  /** Placeholder until dedicated crossbow art exists (Bolts.png is reserved for ammunition). */
  'light crossbow': `${ICON_BASE}/weapons/Shortbow.png`,
  'heavy crossbow': `${ICON_BASE}/weapons/Shortbow.png`,
  arrows: `${ICON_BASE}/weapons/Arrow.png`,
  'crossbow bolts': `${ICON_BASE}/weapons/Bolts.png`
};

const ARMOR_ICONS: Record<string, string> = {
  'light armor': `${ICON_BASE}/armor/Light Armor.png`,
  'medium armor': `${ICON_BASE}/armor/Armor Medium.png`,
  'heavy armor': `${ICON_BASE}/armor/Heavy Armor.png`
};

const ARMOR_BY_TIER: Record<string, string> = {
  light: `${ICON_BASE}/armor/Light Armor.png`,
  medium: `${ICON_BASE}/armor/Armor Medium.png`,
  heavy: `${ICON_BASE}/armor/Heavy Armor.png`
};

const SHIELD_ICONS: Record<string, string> = {
  'parry shield': `${ICON_BASE}/shields/ShieldParry.png`,
  'medium shield': `${ICON_BASE}/shields/Medium Shield.png`,
  'tower shield': `${ICON_BASE}/shields/Tower Shield.png`,
  /** Common synonym for tower / large shield */
  'heavy shield': `${ICON_BASE}/shields/Tower Shield.png`
};

const SHIELD_BY_TYPE: Record<string, string> = {
  parry: `${ICON_BASE}/shields/ShieldParry.png`,
  medium: `${ICON_BASE}/shields/Medium Shield.png`,
  tower: `${ICON_BASE}/shields/Tower Shield.png`
};

const GEAR_ICONS: Record<string, string> = {
  'glass bottle or vial': `${ICON_BASE}/gear/Glass Bottle.png`,
  'holy water (vial)': `${ICON_BASE}/gear/Glass Bottle.png`,
  'oil (flask)': `${ICON_BASE}/gear/Glass Bottle.png`,
  'ink (jar)': `${ICON_BASE}/gear/Glass Bottle.png`,
  'wineskin/waterskin': `${ICON_BASE}/gear/Glass Bottle.png`,
  'rope, hemp 50 ft.': `${ICON_BASE}/gear/Rope.png`,
  'rope, silk 50 ft.': `${ICON_BASE}/gear/Rope.png`,
  'grappling hook': `${ICON_BASE}/gear/Rope.png`,
  'winter blanket': `${ICON_BASE}/gear/Bedroll.png`,
  'tent, small': `${ICON_BASE}/gear/Bedroll.png`,
  'tent, large': `${ICON_BASE}/gear/Bedroll.png`,
  'herbs pouch': `${ICON_BASE}/gear/Herbs Pouch.png`,
  whistle: `${ICON_BASE}/gear/Whistle.png`,
  soap: `${ICON_BASE}/gear/Soap.png`,
  'quiver or bolt case': `${ICON_BASE}/weapons/Arrow.png`
};

const DEFAULT_TYPE_ICONS: Record<string, string> = {
  weapon: `${ICON_BASE}/weapons/Dagger.png`,
  /** Generic armor only — never use a specific tier image here (would mis-label heavy/medium). */
  armor: 'icons/svg/armor.svg',
  /** Generic shield — avoid defaulting to “medium” art for tower/parry. */
  shield: 'icons/svg/shield.svg',
  gear: `${ICON_BASE}/gear/Glass Bottle.png`,
  power: 'icons/svg/aura.svg',
  artifact: 'icons/svg/chest.svg',
  schtick: 'icons/svg/lightning.svg',
  condition: 'icons/svg/acid.svg',
  echo: 'icons/svg/sound.svg',
  masteryNode: 'icons/svg/upgrade.svg',
};

export type ItemIconSystemHint = { type?: string };

/**
 * Resolve the best icon path for an item by name and type.
 * For armor and shields, pass `system` (with `type` tier) so renamed items still match the correct art.
 * Returns null if no custom icon is available.
 */
export function getItemIcon(
  name: string,
  type: string,
  system?: ItemIconSystemHint | null
): string | null {
  const key = name.toLowerCase().trim();

  if (type === 'weapon' && WEAPON_ICONS[key]) return WEAPON_ICONS[key];
  if (type === 'armor') {
    if (ARMOR_ICONS[key]) return ARMOR_ICONS[key];
    const tier = (system?.type || '').toString().toLowerCase();
    if (tier && ARMOR_BY_TIER[tier]) return ARMOR_BY_TIER[tier];
  }
  if (type === 'shield') {
    if (SHIELD_ICONS[key]) return SHIELD_ICONS[key];
    const st = (system?.type || '').toString().toLowerCase();
    if (st && SHIELD_BY_TYPE[st]) return SHIELD_BY_TYPE[st];
  }
  if (type === 'gear' && GEAR_ICONS[key]) return GEAR_ICONS[key];

  return DEFAULT_TYPE_ICONS[type] || null;
}
