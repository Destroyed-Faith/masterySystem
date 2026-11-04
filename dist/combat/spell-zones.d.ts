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
export declare function zoneRoundKey(combatId: string | null | undefined, round: number): string;
export declare function createPersistentZone(input: {
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
}): PersistentZone;
/**
 * @deprecated Legacy factory that required Casting totals. Prefer createPersistentZone.
 * Still produces a zone object so old call sites compile; Casting fields are inert.
 */
export declare function createPersistentSpellZone(input: {
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
}): PersistentZone;
/** @deprecated Duration parsing no longer drives runtime expiry. */
export declare function parseZoneDurationRounds(_note: string | null | undefined, _masteryRank: number): number | null;
export declare function appendSpellZone(zones: readonly PersistentZone[], zone: PersistentZone): PersistentZone[];
export declare function removeSpellZone(zones: readonly PersistentZone[], id: string): PersistentZone[];
/**
 * @deprecated Zones no longer auto-expire by round. Always false unless a
 * legacy flag somehow set expiresAfterRound (ignored by retainActiveSpellZones).
 */
export declare function isPersistentSpellZoneExpired(_zone: PersistentZone, _currentRound: number): boolean;
/** Keep all zones — expiry is maintenance-driven, not round timers. */
export declare function retainActiveSpellZones(zones: readonly PersistentZone[], _currentRound?: number): PersistentZone[];
export declare function zoneAlreadyApplied(zone: PersistentZone, roundKey: string, creatureId: string): boolean;
export declare function markZoneApplied(zone: PersistentZone, roundKey: string, creatureId: string): PersistentZone;
export declare function creatureInsideZone(zone: PersistentZone, x: number, y: number, distanceMeters: (centerX: number, centerY: number) => number): boolean;
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
export declare function spellZonesEntered(zones: readonly PersistentZone[], args: {
    x: number;
    y: number;
    roundKey: string;
    creatureId: string;
    /** Ignored — zones do not use Spell Resistance (Z04). */
    spellResistance?: number;
    distanceMeters: (centerX: number, centerY: number) => number;
}): ZoneEntryHit[];
/** @deprecated Creation never fizzles — zones require no Casting Roll (Z02). */
export declare function zoneCreationOutcome(_castingTotal: number, _spellBaseTn: number): 'fizzle' | 'create';
/** @deprecated Application never resists via Spell TN (Z04). */
export declare function zoneApplicationOutcome(_storedCastingTotal: number, _finalSpellTn: number): 'affect' | 'resist';
export declare function readSpellZones(actor: any): PersistentZone[];
/**
 * Replace the creator's zone list. Foundry `setFlag` merges arrays by index —
 * unset then set the whole list.
 */
export declare function writeSpellZones(actor: any, zones: readonly PersistentZone[]): Promise<void>;
/** Pure helper: which zone ids can be kept given available Attack Actions. */
export declare function selectZonesToMaintain(zoneIds: readonly string[], availableAttackActions: number, preferredKeepIds?: readonly string[] | null): {
    keep: string[];
    end: string[];
};
/** Format printed Special label for UI / applySpecialStringsToTarget. */
export declare function zoneSpecialLabel(zone: PersistentZone): string;
//# sourceMappingURL=spell-zones.d.ts.map