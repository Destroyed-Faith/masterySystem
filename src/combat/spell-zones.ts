/**
 * Persistent Spell zones (DF Core v0.9.9.1).
 * One Casting Roll is stored when the zone is created. Later applications
 * compare that stored result to each creature's current Final Spell TN.
 * A resist does not end the zone, roll again, or cause Stress.
 */

export interface PersistentSpellZone {
  id: string;
  name: string;
  casterId: string;
  spellBaseTn: number;
  castingTotal: number;
  /** `${combatId}:${round}` keys already applied, per creature id. */
  appliedByRound: Record<string, string[]>;
  centerX?: number | null;
  centerY?: number | null;
  radiusMeters?: number;
}

export function zoneCreationOutcome(castingTotal: number, spellBaseTn: number): 'fizzle' | 'create' {
  const total = Math.floor(Number(castingTotal) || 0);
  const base = Math.floor(Number(spellBaseTn) || 0);
  return total < base ? 'fizzle' : 'create';
}

export function zoneApplicationOutcome(storedCastingTotal: number, finalSpellTn: number): 'affect' | 'resist' {
  return Math.floor(Number(storedCastingTotal) || 0) >= Math.floor(Number(finalSpellTn) || 0)
    ? 'affect'
    : 'resist';
}

export function zoneAlreadyApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): boolean {
  return (zone.appliedByRound[roundKey] ?? []).includes(creatureId);
}

export function markZoneApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): PersistentSpellZone {
  if (zoneAlreadyApplied(zone, roundKey, creatureId)) return zone;
  const prev = zone.appliedByRound[roundKey] ?? [];
  return {
    ...zone,
    appliedByRound: { ...zone.appliedByRound, [roundKey]: [...prev, creatureId] },
  };
}

export function readSpellZones(actor: any): PersistentSpellZone[] {
  const raw = actor?.flags?.['mastery-system']?.spellZones
    ?? actor?.getFlag?.('mastery-system', 'spellZones');
  return Array.isArray(raw) ? raw : [];
}
