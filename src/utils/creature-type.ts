/**
 * Creature type catalog (NPC + Summon). No free text — pick from this list.
 *
 * Exorcism(X) applies only to Fiends; Requiem(X) only to Undead (Rules).
 */

export const CREATURE_TYPE_OPTIONS = [
  { value: '', label: '— Creature Type —' },
  { value: 'humanoid', label: 'Humanoid' },
  { value: 'beast', label: 'Beast' },
  { value: 'spirit', label: 'Spirit' },
  { value: 'undead', label: 'Undead' },
  { value: 'fiend', label: 'Fiend' },
  { value: 'construct', label: 'Construct' },
  { value: 'elemental', label: 'Elemental' },
  { value: 'plant', label: 'Plant' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'celestial', label: 'Celestial' },
  { value: 'other', label: 'Other' },
] as const;

export type CreatureTypeValue = (typeof CREATURE_TYPE_OPTIONS)[number]['value'];

const CREATURE_TYPE_KEYS = new Set<string>(
  CREATURE_TYPE_OPTIONS.map((o) => o.value).filter((v) => v !== ''),
);

export function isCreatureTypeKey(value: string): value is Exclude<CreatureTypeValue, ''> {
  return CREATURE_TYPE_KEYS.has(value);
}

export function creatureTypeLabel(value: string | null | undefined): string {
  const key = normalizeCreatureTypeValue(value);
  const hit = CREATURE_TYPE_OPTIONS.find((o) => o.value === key);
  return hit?.label || key || '—';
}

export function creatureTypeSelectOptions(selected?: string | null): Array<{
  value: string;
  label: string;
  selected: boolean;
}> {
  const key = normalizeCreatureTypeValue(selected);
  return CREATURE_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    selected: o.value === key,
  }));
}

/** Map a stored key or leftover free-text to a catalog key. */
export function normalizeCreatureTypeValue(raw: string | null | undefined): CreatureTypeValue {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!value) return '';
  if (isCreatureTypeKey(value)) return value;

  if (
    value === 'untot' ||
    value === 'zombie' ||
    value === 'skeleton' ||
    value === 'vampire' ||
    value === 'geist' ||
    value === 'ghost'
  ) {
    return 'undead';
  }
  if (
    value === 'demon' ||
    value === 'daemon' ||
    value === 'devil' ||
    value === 'dämon' ||
    value === 'daemonisch' ||
    value === 'infernal'
  ) {
    return 'fiend';
  }
  if (value === 'human' || value === 'mensch') return 'humanoid';
  if (value === 'animal' || value === 'tier') return 'beast';
  if (value === 'golem' || value === 'konstrukt') return 'construct';
  if (value === 'elementar') return 'elemental';
  if (value === 'pflanze') return 'plant';
  if (value === 'drache') return 'dragon';
  if (value === 'angel' || value === 'engel') return 'celestial';
  if (value === 'sonstige') return 'other';
  return '';
}

/** Normalize free-text / sheet values to a canonical creature-type key. */
export function resolveCreatureType(actor: { system?: any } | null | undefined): string {
  const sys = actor?.system;
  return normalizeCreatureTypeValue(sys?.creatureType ?? sys?.bio?.type ?? '');
}

/** True when Exorcism(X) may be applied (Fiend only). */
export function isExorcismValidTarget(actor: { system?: any } | null | undefined): boolean {
  return resolveCreatureType(actor) === 'fiend';
}

/** True when Requiem(X) may be applied (Undead only). */
export function isRequiemValidTarget(actor: { system?: any } | null | undefined): boolean {
  return resolveCreatureType(actor) === 'undead';
}

/** Tag gate for a targeted Special id (`exorcism` / `requiem`). */
export function isTargetedSpecialValidTarget(
  specialId: string,
  actor: { system?: any } | null | undefined,
): boolean {
  const id = String(specialId ?? '').trim().toLowerCase();
  if (id === 'exorcism') return isExorcismValidTarget(actor);
  if (id === 'requiem') return isRequiemValidTarget(actor);
  return true;
}
