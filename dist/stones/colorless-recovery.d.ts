/**
 * Colorless Recovery (v0.9.9.5) designates specific Colorless Stones.
 * It does not regenerate them and does not raise the shared MR recovery limit.
 */
export declare const COLORLESS_RECOVERY_COSTS: readonly [1, 3, 7, 15];
export declare const COLORLESS_RECOVERY_CAPACITIES: readonly [2, 4, 8, 16];
export type ColorlessStoneSource = 'permanent' | 'initiative' | 'absorption' | 'granted';
export type ColorlessStoneState = 'ready' | 'exhausted' | 'sealed' | 'bound';
export interface ColorlessStoneRow {
    id: string;
    source: ColorlessStoneSource;
    state: ColorlessStoneState;
    temporary: boolean;
}
export interface ColorlessRecoveryRecord {
    combatId: string;
    rank: number;
    eligible: number;
    capacity: number;
    used: true;
    selectedIds: string[];
}
export declare function colorlessRecoverySpec(rank: number): {
    cost: number;
    capacity: number;
} | null;
export declare function readColorlessRecovery(actor: any, combatId?: string): ColorlessRecoveryRecord | null;
/** Designated stones that are Exhausted right now. Not a lifetime regen budget. */
export declare function designatedExhaustedColorlessIds(actor: any): string[];
export declare function colorlessRecoveryPreparationOpen(actor: any, combat: {
    id?: string;
    round?: number;
    started?: boolean;
} | null): boolean;
export declare function listColorlessStones(actor: any): ColorlessStoneRow[];
export declare function syncColorlessStoneLedger(actor: any): Promise<ColorlessStoneRow[]>;
export declare function colorlessRecoveryFreeSlots(actor: any): number;
/** Called by the Stone Ability apply(). Does not spend Stones and does not regenerate any. */
export declare function recordColorlessRecoveryActivation(actor: any, tier: number): Promise<void>;
export declare function commitColorlessRecovery(args: {
    actor: any;
    combatant: any;
    rank: number;
    selectedIds: string[];
    combat?: {
        id?: string;
        round?: number;
        started?: boolean;
    } | null;
}): Promise<{
    ok: boolean;
    reason?: string;
}>;
export declare function assignLaterColorlessRecovery(actor: any, ids: string[]): Promise<{
    ok: boolean;
    added: string[];
    reason?: string;
}>;
export declare function restoreDesignatedColorlessStones(actor: any, ids: string[]): Promise<string[]>;
/** Remove a temporary source. Designated slots stay occupied; the Stones are gone. */
export declare function expireTemporaryColorlessSource(actor: any, source: 'absorption' | 'granted' | 'initiative'): Promise<void>;
export declare function clearColorlessRecovery(actor: any): Promise<void>;
//# sourceMappingURL=colorless-recovery.d.ts.map