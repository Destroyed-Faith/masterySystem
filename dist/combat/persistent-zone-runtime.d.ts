/**
 * Persistent Zone runtime (Z02–Z06): create, maintain, apply, end.
 * Uses central applySpecialStringsToTarget — no parallel Special resolver.
 */
import { type PersistentZone } from './spell-zones.js';
export declare function isPersistentZonePower(item: any): boolean;
export declare function readZonePlacementProfile(item: any): {
    rangeMeters: number;
    radiusMeters: number;
    specialKey: string;
    specialRank: number;
    delivery: 'martial' | 'spell';
    templateId: string;
    technicalReference: string;
} | null;
/**
 * Place a Persistent Zone: spend 1 Attack Action, no rolls, apply Specials immediately.
 */
export declare function createPersistentZoneFromPower(args: {
    creator: any;
    item: any;
    centerX: number;
    centerY: number;
    combat?: any | null;
    scene?: any | null;
    /** Skip Attack Action spend (tests / already paid). */
    skipActionSpend?: boolean;
}): Promise<{
    ok: boolean;
    zone?: PersistentZone;
    reason?: string;
}>;
/**
 * Apply zone Special to every creature currently inside, once per Round.
 */
export declare function applyZoneToCreaturesInArea(creator: any, zone: PersistentZone, combat: any, _reason: 'creation' | 'entry' | 'turn-start'): Promise<PersistentZone>;
/** Movement entry: apply any zones the creature just entered (Z06 B). */
export declare function applyPersistentZonesOnCreatureEnter(creature: any, tokenDoc: any, combat: any): Promise<void>;
/**
 * Target Turn Start (Z06 C): after ticks/recovery/decay, apply zones the
 * creature occupies if not yet applied this Round.
 */
export declare function applyPersistentZonesAtTargetTurnStart(creature: any, combat: any): Promise<void>;
/** Voluntarily end one zone (no Action refund). */
export declare function endPersistentZone(creator: any, zoneId: string): Promise<boolean>;
/** End all zones for a creator (combat end / incapacitated cleanup). */
export declare function endAllPersistentZones(creator: any): Promise<void>;
/**
 * Creator Turn Start maintenance (Z03).
 * Spends 1 Attack Action per kept zone. Unpaid zones end immediately.
 * Maintenance is NOT a new power activation and does NOT re-apply Specials.
 */
export declare function maintainPersistentZonesAtCreatorTurnStart(creator: any, combat: any, preferredKeepIds?: string[] | null): Promise<{
    kept: string[];
    ended: string[];
}>;
/** Alias */
export declare const runPersistentZoneMaintenance: typeof maintainPersistentZonesAtCreatorTurnStart;
export declare const maintainZonesAtTurnStart: typeof maintainPersistentZonesAtCreatorTurnStart;
//# sourceMappingURL=persistent-zone-runtime.d.ts.map