/**
 * Persistent Spell zones (DF Core v0.9.9.1).
 * Each zone instance keeps its own Casting result. A later zone from the
 * same caster does not replace an earlier one. Applications compare that
 * zone's stored result to the creature's Final Spell TN at that moment.
 * A resist does not end the zone, roll again, or cause Stress.
 * A zone with no stored center is not a scene-wide scan.
 */
export interface PersistentSpellZone {
    id: string;
    name: string;
    casterId: string;
    spellBaseTn: number;
    /** Casting result frozen on this zone instance. */
    castingTotal: number;
    sourceMasteryRank?: number;
    powerId?: string | null;
    templateId?: string | null;
    durationNote?: string | null;
    createdRound?: number;
    /** Last combat round this zone still applies. Null means no parsed expiry. */
    expiresAfterRound?: number | null;
    sceneId?: string | null;
    /** `${combatId}:${round}` keys already applied, per creature id. */
    appliedByRound: Record<string, string[]>;
    centerX?: number | null;
    centerY?: number | null;
    radiusMeters?: number;
}
export declare function parseZoneDurationRounds(note: string | null | undefined, masteryRank: number): number | null;
export declare function createPersistentSpellZone(input: {
    id: string;
    name: string;
    casterId: string;
    spellBaseTn: number;
    castingTotal: number;
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
}): PersistentSpellZone;
/** New array. Existing zones keep their own Casting results. */
export declare function appendSpellZone(zones: readonly PersistentSpellZone[], zone: PersistentSpellZone): PersistentSpellZone[];
export declare function removeSpellZone(zones: readonly PersistentSpellZone[], id: string): PersistentSpellZone[];
export declare function isPersistentSpellZoneExpired(zone: PersistentSpellZone, currentRound: number): boolean;
export declare function retainActiveSpellZones(zones: readonly PersistentSpellZone[], currentRound: number): PersistentSpellZone[];
export interface SpellZoneEntryHit {
    zoneId: string;
    castingTotal: number;
    spellBaseTn: number;
    finalTn: number;
    outcome: 'affect' | 'resist';
}
/**
 * Zones this creature has entered. Zones without a stored center are skipped.
 * This does not search the scene for other tokens.
 */
export declare function spellZonesEntered(zones: readonly PersistentSpellZone[], args: {
    x: number;
    y: number;
    roundKey: string;
    creatureId: string;
    spellResistance: number;
    distanceMeters: (centerX: number, centerY: number) => number;
}): SpellZoneEntryHit[];
export declare function zoneCreationOutcome(castingTotal: number, spellBaseTn: number): 'fizzle' | 'create';
export declare function zoneApplicationOutcome(storedCastingTotal: number, finalSpellTn: number): 'affect' | 'resist';
export declare function zoneAlreadyApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): boolean;
export declare function markZoneApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): PersistentSpellZone;
export declare function readSpellZones(actor: any): PersistentSpellZone[];
/**
 * Replace the caster's zone list. Foundry `setFlag` merges arrays by index
 * and can keep a deleted zone or overwrite an earlier Casting result.
 * Unset, then set the whole list.
 */
export declare function writeSpellZones(actor: any, zones: readonly PersistentSpellZone[]): Promise<void>;
//# sourceMappingURL=spell-zones.d.ts.map