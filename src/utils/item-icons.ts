const ICON_BASE = 'systems/mastery-system/assets/icons/items';

const WEAPON_ICONS: Record<string, string> = {
  'dagger': `${ICON_BASE}/weapons/Dagger.png`,
  'whip': `${ICON_BASE}/weapons/Whip.png`,
};

const ARMOR_ICONS: Record<string, string> = {
  'light armor': `${ICON_BASE}/armor/Light Armor.png`,
  'medium armor': `${ICON_BASE}/armor/Armor Medium.png`,
};

const SHIELD_ICONS: Record<string, string> = {
  'parry shield': `${ICON_BASE}/shields/ShieldParry.png`,
  'medium shield': `${ICON_BASE}/shields/Medium Shield.png`,
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
};

const DEFAULT_TYPE_ICONS: Record<string, string> = {
  weapon: `${ICON_BASE}/weapons/Dagger.png`,
  armor: `${ICON_BASE}/armor/Light Armor.png`,
  shield: `${ICON_BASE}/shields/Medium Shield.png`,
  gear: `${ICON_BASE}/gear/Glass Bottle.png`,
  power: 'icons/svg/aura.svg',
  artifact: 'icons/svg/chest.svg',
  schtick: 'icons/svg/lightning.svg',
  condition: 'icons/svg/acid.svg',
  echo: 'icons/svg/sound.svg',
  masteryNode: 'icons/svg/upgrade.svg',
};

/**
 * Resolve the best icon path for an item by name and type.
 * Returns null if no custom icon is available.
 */
export function getItemIcon(name: string, type: string): string | null {
  const key = name.toLowerCase().trim();

  if (type === 'weapon' && WEAPON_ICONS[key]) return WEAPON_ICONS[key];
  if (type === 'armor' && ARMOR_ICONS[key]) return ARMOR_ICONS[key];
  if (type === 'shield' && SHIELD_ICONS[key]) return SHIELD_ICONS[key];
  if (type === 'gear' && GEAR_ICONS[key]) return GEAR_ICONS[key];

  return DEFAULT_TYPE_ICONS[type] || null;
}
