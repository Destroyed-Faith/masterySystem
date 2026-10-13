/**
 * Per-character combat ledger of remaining Ready stones.
 *
 * Actor `system.stonePools.*.current` alone is not enough: world vs token
 * copies can disagree and `livePoolFields` used to take MAX, so spent stones
 * looked full again at Round 2. This flag is the combat source of truth for
 * how many Ready stones each pool still has.
 */
export declare const STONE_COMBAT_READY_FLAG = "stoneCombatReady";
export interface StoneCombatReadyLedger {
    combatId: string;
    /** Remaining Ready stones per pool (attributes + colorless). */
    pools: Record<string, number>;
}
/** Most depleted live current across world/token copies (never MAX). */
export declare function minLivePoolCurrent(actor: any, attr: string): number;
export declare function readStoneCombatReady(actor: any, combatId?: string): StoneCombatReadyLedger | null;
/**
 * Remaining Ready for one pool while this combat's ledger is active.
 * Returns null when out of combat or no ledger yet (caller falls back to pools).
 * Never exceeds the lowest live `current` — spent through any path stays spent.
 */
export declare function combatReadyRemaining(actor: any, attr: string, combatId?: string): number | null;
export declare function writeStoneCombatReady(actor: any, ledger: StoneCombatReadyLedger): Promise<void>;
export declare function clearStoneCombatReady(actor: any): Promise<void>;
/** Snapshot remaining Ready from the most depleted live pools. */
export declare function snapshotStoneCombatReadyPools(actor: any): Record<string, number>;
/**
 * Mirror ledger Ready values onto every world/token pool copy so a stale full
 * sibling cannot win the next Available read. Only ever LOWERS a copy — a copy
 * that is already below the ledger was spent through a path the ledger did
 * not see, and raising it would resurrect spent stones.
 */
export declare function mirrorStoneCombatReadyToPools(actor: any, ledger: StoneCombatReadyLedger): Promise<void>;
/**
 * Ensure a combat ledger exists for this fight. Seeds from the lowest live
 * `current` across sync copies so a stale full world actor cannot inflate Ready.
 * An existing ledger is reconciled DOWN to the lowest live copy (spent is
 * spent), then stale-full copies are lowered to the ledger.
 */
export declare function ensureStoneCombatReady(actor: any, combat: {
    id?: string;
    started?: boolean;
} | null | undefined): Promise<StoneCombatReadyLedger | null>;
/**
 * Force-overwrite the combat ledger (Round-1 refill / prep).
 * Pass explicit `pools` when you just wrote them — do not re-snapshot MIN across
 * stale token copies or the refill would be undone.
 */
export declare function resealStoneCombatReadyFromPools(actor: any, combat: {
    id?: string;
    started?: boolean;
} | null | undefined, pools?: Record<string, number>): Promise<void>;
/**
 * Set remaining Ready for one pool: update ledger + mirror `current` onto every
 * sync document so world/token copies cannot diverge again.
 */
export declare function setCombatPoolCurrent(actor: any, attr: string, current: number, combat?: {
    id?: string;
    started?: boolean;
} | null): Promise<void>;
/**
 * Add recovered stones into ledger + pools (capped by caller before call).
 */
export declare function addCombatPoolCurrent(actor: any, attr: string, add: number, combat?: {
    id?: string;
    started?: boolean;
} | null): Promise<number>;
//# sourceMappingURL=stone-combat-ledger.d.ts.map