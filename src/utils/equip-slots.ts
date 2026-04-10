/**
 * Paperdoll slot keys (must match character sheet slot defs + CSS grid areas).
 */
export const PAPERDOLL_SLOT_KEYS = [
  'helmet',
  'necklace',
  'chest',
  'cloak',
  'glove',
  'ring1',
  'belt',
  'mainhand',
  'leggings',
  'offhand',
  'boot'
] as const;

export type PaperdollSlotKey = (typeof PAPERDOLL_SLOT_KEYS)[number];

const SLOT_SET = new Set<string>(PAPERDOLL_SLOT_KEYS);

/**
 * Valid, non-empty equip slot list from item.system.equipSlots, or null if the item cannot be equipped.
 */
export function getNormalizedEquipSlots(item: { system?: { equipSlots?: unknown } } | null | undefined): string[] | null {
  if (!item?.system) return null;
  const raw = item.system.equipSlots;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out = raw.filter((s): s is string => typeof s === 'string' && SLOT_SET.has(s));
  return out.length > 0 ? out : null;
}

/**
 * Default slots for weapon / armor / shield when backfilling legacy items (GM migration).
 * Gear is not inferred — leave equipSlots unset or empty for non-equippable gear.
 */
export function inferDefaultEquipSlotsForType(item: {
  type?: string;
  system?: { hands?: number };
}): string[] | null {
  const t = item?.type;
  if (t === 'weapon') {
    const h = Number(item.system?.hands ?? 1);
    return h === 2 ? ['mainhand'] : ['mainhand', 'offhand'];
  }
  if (t === 'armor') return ['chest'];
  if (t === 'shield') return ['offhand'];
  return null;
}

/**
 * Paperdoll slots for artifact items from artifactKind + profiles (matches weapon/shield/armor rules).
 */
export function inferArtifactEquipSlots(system: {
  artifactKind?: string;
  gearSlot?: string;
  artifactWeapon?: { hands?: number };
} | null | undefined): string[] | null {
  if (!system) return null;
  const kind = system.artifactKind || 'weapon';
  if (kind === 'weapon') {
    const h = Number(system.artifactWeapon?.hands ?? 1);
    return h === 2 ? ['mainhand'] : ['mainhand', 'offhand'];
  }
  if (kind === 'armor') return ['chest'];
  if (kind === 'shield') return ['offhand'];
  if (kind === 'gear') {
    let gs = String(system.gearSlot || '').trim();
    // Paperdoll has one ring cell (ring1); "Ring (2)" maps to the same slot for equipping.
    if (gs === 'ring2') gs = 'ring1';
    if (gs && SLOT_SET.has(gs)) return [gs];
    return null;
  }
  return null;
}
