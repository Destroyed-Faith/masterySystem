/**
 * Combat Snapshot — GM export/import of a full fight state as versioned JSON.
 *
 * Captures Combat fields (round/turn/initiative) plus per-combatant actor/token
 * economy state (stones, specials, HP, roundState, …). Restore targets the
 * active combat on the same scene.
 */
export declare const COMBAT_SNAPSHOT_KIND = "mastery-combat-snapshot";
export declare const COMBAT_SNAPSHOT_SCHEMA_VERSION = 1;
/** Actor-side mastery flags that belong to a fight. */
export declare const COMBAT_ACTOR_FLAG_KEYS: readonly ["roundState", "stoneUsage", "stoneCombatReady", "stonePowersRoundPlan", "stonePowersConfigLock", "preparationPhase", "tempHPSources", "tempColorlessStones", "initiativeColorlessStones", "initiativeColorlessExhausted", "absorbedDamage", "absorptionStoneExpiry", "phasingCharges", "dnReserve", "specialRoundApps", "naturalSpecialRecovery", "deathState", "grapple", "spellZones", "perceptionCombat", "initiativeRolledFor", "movedThisTurnM", "lacerateStageThisTurn", "safeMoveNotedThisTurn", "slipMovementActive", "pendingSafeMovement", "pendingSlip", "firstAidReceived", "bloodRaiseHpLostThisCombat", "stressBreakdownPending", "stressBreakdownVirtueKeep", "msInitiativeBoostUsed", "msPhasingStoneUsed", "msTempHpStoneUsed", "statusJson", "statusEffects"];
/** Combatant-side mastery flags. */
export declare const COMBATANT_FLAG_KEYS: readonly ["encounterSetupStep", "msInitiativeValue", "msInitiativeBoostThisRound", "pendingInitiativeShop", "npcInitiativeRolled", "initiativeShop"];
/** Combat-document mastery flags. */
export declare const COMBAT_FLAG_KEYS: readonly ["encounterSetup", "stonePowersState", "stoneRoundSummaryPosted", "stoneSpendByRound"];
export interface CombatSnapshotCombatant {
    id: string;
    name: string;
    actorId: string;
    actorUuid?: string;
    tokenId: string;
    tokenUuid?: string;
    actorLink: boolean;
    initiative: number | null;
    defeated: boolean;
    hidden: boolean;
    flags: Record<string, unknown>;
    economyOwner: {
        kind: 'world' | 'token';
        actorId: string;
        actorUuid: string;
    };
    actor: {
        system: {
            health?: unknown;
            stress?: unknown;
            stonePools?: unknown;
            npcActivePhaseIndex?: unknown;
            phases?: unknown;
        };
        flags: Record<string, unknown>;
        activeBuffEffects: unknown[];
        statusEffects: unknown[];
    };
    token: {
        x?: number;
        y?: number;
        elevation?: number;
        rotation?: number;
        alpha?: number;
        flags: Record<string, unknown>;
    };
}
export interface CombatSnapshot {
    exportKind: typeof COMBAT_SNAPSHOT_KIND;
    schemaVersion: number;
    exportedAt: string;
    worldId?: string;
    scene: {
        id: string;
        name?: string;
    };
    combat: {
        id: string;
        name?: string;
        started: boolean;
        round: number;
        turn: number;
        flags: Record<string, unknown>;
        combatants: CombatSnapshotCombatant[];
    };
}
export type SnapshotValidateResult = {
    ok: true;
    snapshot: CombatSnapshot;
} | {
    ok: false;
    reason: string;
};
/** Capture the live combat into a portable snapshot. */
export declare function captureCombatSnapshot(combat: any): CombatSnapshot;
export declare function validateCombatSnapshot(raw: unknown): SnapshotValidateResult;
/**
 * Deep-replace string values equal to `fromId`, and any `combatId` property.
 * Used when the live Combat document id differs from the snapshot.
 */
export declare function remapCombatIdsInValue(value: unknown, fromId: string, toId: string): unknown;
export declare function matchSnapshotCombatant(snap: CombatSnapshotCombatant, liveCombatants: any[]): any | null;
/**
 * Apply a validated snapshot onto the live combat (same scene). GM-only caller.
 */
export declare function applyCombatSnapshot(combat: any, snapshot: CombatSnapshot): Promise<{
    ok: boolean;
    reason?: string;
}>;
export declare function downloadCombatSnapshot(snapshot: CombatSnapshot): void;
/** GM: capture + download active combat. */
export declare function exportActiveCombatSnapshot(): Promise<void>;
/** GM: file picker → confirm → apply onto active combat. */
export declare function promptImportCombatSnapshot(): Promise<void>;
//# sourceMappingURL=combat-snapshot.d.ts.map