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
export declare function zoneCreationOutcome(castingTotal: number, spellBaseTn: number): 'fizzle' | 'create';
export declare function zoneApplicationOutcome(storedCastingTotal: number, finalSpellTn: number): 'affect' | 'resist';
export declare function zoneAlreadyApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): boolean;
export declare function markZoneApplied(zone: PersistentSpellZone, roundKey: string, creatureId: string): PersistentSpellZone;
export declare function readSpellZones(actor: any): PersistentSpellZone[];
//# sourceMappingURL=spell-zones.d.ts.map