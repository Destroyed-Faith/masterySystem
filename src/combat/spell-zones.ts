/**
 * Persistent Special Zones (Destroyed Faith Z02 / Z03 / Z04 / Z06 — 2026-11-04).
 *
 * Stationary Ranged Active zones: place for 1 Attack Action, maintain for
 * 1 Attack Action per zone at the creator's Turn Start, auto-apply the printed
 * Special to every creature in the radius (no Attack / Casting / Evade /
 * Spell Resistance rolls). Once per zone source × target × combat Round.
 *
 * Legacy Casting-TN / 4-Round expiry fields are ignored by the runtime.
 */

export interface PersistentZone {
  /** Stable Source ID for once-per-round tracking and Special stacking. */
  id: string;
  name: string;
  /** Creator actor id. */
  creatorId: string;
  /** @deprecated alias — prefer creatorId */
  casterId?: string;
  powerId?: string | null;
  templateId?: string | null;
  /** Technical power reference — creation counts toward once-per-Round use; maintenance does not. */
  technicalReference?: string | null;
  specialKey: string;
  specialRank: number;
  /** Martial or Spell delivery flavour — neither requires a hit/casting roll for zones. */
  delivery?: 'martial' | 'spell' | null;
  sceneId?: string | null;
  measuredTemplateId?: string | null;
  createdRound?: number;
  centerX?: number | null;
  centerY?: number | null;
  radiusMeters?: number;
  /**
   * `${combatId}:${round}` → creature ids already affected this Round.
   * Identity: zoneId + creatureId + combatRound.
   */
  appliedByRound: Record<string, string[]>;
  /**
   * @deprecated Legacy DF Casting fields — kept so old world flags deserialize.
   * Runtime never compares Casting totals or Spell Base TN for zones.
   */
  spellBaseTn?: number;
  castingTotal?: number;
  sourceMasteryRank?: number;
  durationNote?: string | null;
  /** @deprecated Legacy auto-expiry — ignored (maintenance ends zones). */
  expiresAfterRound?: number | null;
}

/** @deprecated Use PersistentZone */
export type PersistentSpellZone = PersistentZone;

export function zoneRoundKey(combatId: string | null | undefined, round: number): string {
  return `${String(combatId ?? '')}:${Math.max(0, Math.floor(Number(round) || 0))}`;
}

export function createPersistentZone(input: {
  id: string;
  name: string;
  creatorId: string;
  powerId?: string | null;
  templateId?: string | null;
  technicalReference?: string | null;
  specialKey: string;
  specialRank: number;
  delivery?: 'martial' | 'spell' | null;
  sceneId?: string | null;
  measuredTemplateId?: string | null;
  createdRound?: number;
  centerX?: number | null;
  centerY?: number | null;
  radiusMeters?: number;
  appliedByRound?: Record<string, string[]>;
}): PersistentZone {
  const creatorId = String(input.creatorId || '');
  return {
    id: String(input.id),
    name: String(input.name || 'Persistent Zone'),
    creatorId,
    casterId: creatorId,
    powerId: input.powerId ?? null,
    templateId: input.templateId ?? null,
    technicalReference: input.technicalReference ?? input.templateId ?? input.powerId ?? null,
    specialKey: String(input.specialKey || '').trim().toLowerCase(),
    specialRank: Math.max(0, Math.floor(Number(input.specialRank) || 0)),
    delivery: input.delivery ?? null,
    sceneId: input.sceneId ?? null,
    measuredTemplateId: input.measuredTemplateId ?? null,
    createdRound: Math.max(0, Math.floor(Number(input.createdRound) || 0)),
    centerX: input.centerX ?? null,
    centerY: input.centerY ?? null,
    radiusMeters: Math.max(0, Number(input.radiusMeters) || 0),
    appliedByRound: input.appliedByRound ? { ...input.appliedByRound } : {},
    // No automatic round expiry (Z02).
    expiresAfterRound: null,
    durationNote: 'maintained',
  };
}

/**
 * @deprecated Legacy factory that required Casting totals. Prefer createPersistentZone.
 * Still produces a zone object so old call sites compile; Casting fields are inert.
 */
export function createPersistentSpellZone(input: {
  id: string;
  name: string;
  casterId: string;
  spellBaseTn?: number;
  castingTotal?: number;
  sourceMasteryRank?: number;
  powerId?: string | null;
  templateId?: string | null;
  durationNote?: string | null;
  createdRound?: number;
  sceneId?: string | null;
  appliedByRound?: Record<string, string[]>;
  centerX?: number | null;
  centerY?: number | null;
  radiusMeters?: number;
  specialKey?: string;
  specialRank?: number;
}): PersistentZone {
  const zone = createPersistentZone({
    id: input.id,
    name: input.name,
    creatorId: input.casterId,
    powerId: input.powerId,
    templateId: input.templateId,
    specialKey: input.specialKey || 'blight',
    specialRank: input.specialRank ?? 1,
    createdRound: input.createdRound,
    sceneId: input.sceneId,
    appliedByRound: input.appliedByRound,
    centerX: input.centerX,
    centerY: input.centerY,
    radiusMeters: input.radiusMeters,
  });
  // Preserve inert legacy fields for world data / old tests that still read them.
  zone.spellBaseTn = Math.floor(Number(input.spellBaseTn) || 0);
  zone.castingTotal = Math.floor(Number(input.castingTotal) || 0);
  zone.sourceMasteryRank = Math.max(1, Math.floor(Number(input.sourceMasteryRank) || 0)) || undefined;
  zone.durationNote = input.durationNote ?? 'maintained';
  // Do NOT set expiresAfterRound from durationNote (Z02 removes auto 4-Round timer).
  zone.expiresAfterRound = null;
  return zone;
}

/** @deprecated Duration parsing no longer drives runtime expiry. */
export function parseZoneDurationRounds(_note: string | null | undefined, _masteryRank: number): number | null {
  return null;
}

export function appendSpellZone(
  zones: readonly PersistentZone[],
  zone: PersistentZone,
): PersistentZone[] {
  const copy = zones.map((entry) => ({ ...entry, appliedByRound: { ...entry.appliedByRound } }));
  if (copy.some((entry) => entry.id === zone.id)) return copy;
  return [...copy, { ...zone, appliedByRound: { ...zone.appliedByRound } }];
}

export function removeSpellZone(zones: readonly PersistentZone[], id: string): PersistentZone[] {
  return zones
    .filter((zone) => zone.id !== id)
    .map((zone) => ({ ...zone, appliedByRound: { ...zone.appliedByRound } }));
}

/**
 * @deprecated Zones no longer auto-expire by round. Always false unless a
 * legacy flag somehow set expiresAfterRound (ignored by retainActiveSpellZones).
 */
export function isPersistentSpellZoneExpired(_zone: PersistentZone, _currentRound: number): boolean {
  return false;
}

/** Keep all zones — expiry is maintenance-driven, not round timers. */
export function retainActiveSpellZones(
  zones: readonly PersistentZone[],
  _currentRound?: number,
): PersistentZone[] {
  return zones.map((zone) => ({ ...zone, appliedByRound: { ...zone.appliedByRound } }));
}

export function zoneAlreadyApplied(
  zone: PersistentZone,
  roundKey: string,
  creatureId: string,
): boolean {
  return (zone.appliedByRound[roundKey] ?? []).includes(String(creatureId));
}

export function markZoneApplied(
  zone: PersistentZone,
  roundKey: string,
  creatureId: string,
): PersistentZone {
  const id = String(creatureId);
  if (zoneAlreadyApplied(zone, roundKey, id)) return zone;
  const prev = zone.appliedByRound[roundKey] ?? [];
  return {
    ...zone,
    appliedByRound: { ...zone.appliedByRound, [roundKey]: [...prev, id] },
  };
}

export function creatureInsideZone(
  zone: PersistentZone,
  x: number,
  y: number,
  distanceMeters: (centerX: number, centerY: number) => number,
): boolean {
  if (zone.centerX == null || zone.centerY == null || (zone.radiusMeters ?? 0) <= 0) return false;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return distanceMeters(Number(zone.centerX), Number(zone.centerY)) <= (zone.radiusMeters ?? 0);
}

export interface ZoneEntryHit {
  zoneId: string;
  specialKey: string;
  specialRank: number;
  /** Always affect — no Spell Resistance / Evade for Persistent Zones (Z04). */
  outcome: 'affect';
  /** @deprecated Legacy fields for old UI strings. */
  castingTotal?: number;
  spellBaseTn?: number;
  finalTn?: number;
}

/**
 * Zones this creature occupies that have not yet applied this Round.
 * No Spell Resistance comparison. No friend/foe filter.
 */
export function spellZonesEntered(
  zones: readonly PersistentZone[],
  args: {
    x: number;
    y: number;
    roundKey: string;
    creatureId: string;
    /** Ignored — zones do not use Spell Resistance (Z04). */
    spellResistance?: number;
    distanceMeters: (centerX: number, centerY: number) => number;
  },
): ZoneEntryHit[] {
  if (!Number.isFinite(args.x) || !Number.isFinite(args.y)) return [];
  const hits: ZoneEntryHit[] = [];
  for (const zone of zones) {
    if (!creatureInsideZone(zone, args.x, args.y, args.distanceMeters)) continue;
    if (zoneAlreadyApplied(zone, args.roundKey, args.creatureId)) continue;
    hits.push({
      zoneId: zone.id,
      specialKey: zone.specialKey,
      specialRank: zone.specialRank,
      outcome: 'affect',
      castingTotal: zone.castingTotal,
      spellBaseTn: zone.spellBaseTn,
      finalTn: 0,
    });
  }
  return hits;
}

/** @deprecated Creation never fizzles — zones require no Casting Roll (Z02). */
export function zoneCreationOutcome(_castingTotal: number, _spellBaseTn: number): 'fizzle' | 'create' {
  return 'create';
}

/** @deprecated Application never resists via Spell TN (Z04). */
export function zoneApplicationOutcome(
  _storedCastingTotal: number,
  _finalSpellTn: number,
): 'affect' | 'resist' {
  return 'affect';
}

export function readSpellZones(actor: any): PersistentZone[] {
  const raw =
    actor?.flags?.['mastery-system']?.spellZones ??
    actor?.getFlag?.('mastery-system', 'spellZones');
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((zone) => zone && typeof zone === 'object')
    .map((zone: any) => normalizeLegacyZone(zone));
}

function normalizeLegacyZone(raw: any): PersistentZone {
  const creatorId = String(raw.creatorId || raw.casterId || '');
  return {
    id: String(raw.id || ''),
    name: String(raw.name || 'Persistent Zone'),
    creatorId,
    casterId: creatorId,
    powerId: raw.powerId ?? null,
    templateId: raw.templateId ?? null,
    technicalReference: raw.technicalReference ?? raw.templateId ?? raw.powerId ?? null,
    specialKey: String(raw.specialKey || 'blight').trim().toLowerCase(),
    specialRank: Math.max(0, Math.floor(Number(raw.specialRank) || 1)),
    delivery: raw.delivery ?? null,
    sceneId: raw.sceneId ?? null,
    measuredTemplateId: raw.measuredTemplateId ?? null,
    createdRound: Math.max(0, Math.floor(Number(raw.createdRound) || 0)),
    centerX: raw.centerX ?? null,
    centerY: raw.centerY ?? null,
    radiusMeters: Math.max(0, Number(raw.radiusMeters) || 0),
    appliedByRound:
      raw.appliedByRound && typeof raw.appliedByRound === 'object' ? { ...raw.appliedByRound } : {},
    spellBaseTn: raw.spellBaseTn,
    castingTotal: raw.castingTotal,
    sourceMasteryRank: raw.sourceMasteryRank,
    durationNote: raw.durationNote ?? 'maintained',
    // Strip legacy auto-expiry so old worlds do not drop zones mid-combat.
    expiresAfterRound: null,
  };
}

/**
 * Replace the creator's zone list. Foundry `setFlag` merges arrays by index —
 * unset then set the whole list.
 */
export async function writeSpellZones(actor: any, zones: readonly PersistentZone[]): Promise<void> {
  const copy = zones.map((zone) => ({
    ...normalizeLegacyZone(zone),
    appliedByRound: { ...(zone.appliedByRound ?? {}) },
  }));
  if (typeof actor?.unsetFlag === 'function') {
    try {
      await actor.unsetFlag('mastery-system', 'spellZones');
    } catch {
      /* flag may not exist */
    }
  }
  if (typeof actor?.setFlag === 'function') {
    await actor.setFlag('mastery-system', 'spellZones', copy);
    return;
  }
  const flags = (actor.flags = actor.flags || {});
  const ns = (flags['mastery-system'] = flags['mastery-system'] || {});
  ns.spellZones = copy;
}

/** Pure helper: which zone ids can be kept given available Attack Actions. */
export function selectZonesToMaintain(
  zoneIds: readonly string[],
  availableAttackActions: number,
  preferredKeepIds?: readonly string[] | null,
): { keep: string[]; end: string[] } {
  const avail = Math.max(0, Math.floor(Number(availableAttackActions) || 0));
  const ids = zoneIds.map(String).filter(Boolean);
  if (avail <= 0) return { keep: [], end: [...ids] };
  if (ids.length <= avail) return { keep: [...ids], end: [] };

  const preferred = (preferredKeepIds ?? []).map(String).filter((id) => ids.includes(id));
  const keep: string[] = [];
  for (const id of preferred) {
    if (keep.length >= avail) break;
    if (!keep.includes(id)) keep.push(id);
  }
  for (const id of ids) {
    if (keep.length >= avail) break;
    if (!keep.includes(id)) keep.push(id);
  }
  const end = ids.filter((id) => !keep.includes(id));
  return { keep, end };
}

/** Format printed Special label for UI / applySpecialStringsToTarget. */
export function zoneSpecialLabel(zone: PersistentZone): string {
  const key = String(zone.specialKey || 'special').trim();
  const rank = Math.max(0, Math.floor(Number(zone.specialRank) || 0));
  if (!key) return '';
  const pretty = key.charAt(0).toUpperCase() + key.slice(1);
  return rank > 0 ? `${pretty}(${rank})` : pretty;
}
